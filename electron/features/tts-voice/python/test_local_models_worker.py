"""Adapter contract tests; no model weights or GPU required."""
import io
from pathlib import Path
import tempfile
import types
import unittest
from unittest.mock import Mock, patch
import zipfile
import json

import local_models_worker as worker
import qwen_mlx_adapter as mlx_adapter
import cosy_mps_adapter as cosy_adapter


class LocalModelTests(unittest.TestCase):
    def setUp(self):
        worker.CACHED_MODEL = None
        worker.CACHED_KEY = None
        worker.CLONE_PROMPTS.clear()

    def request(self, variant='CustomVoice', **kwargs):
        return dict(engine='qwen3', repository=f'Qwen/Qwen3-TTS-12Hz-0.6B-{variant}',
                    text='Hello', mode='preset', language='en', **kwargs)

    def test_custom_voice_passes_speaker_and_language(self):
        model = Mock()
        request = self.request(qwenSpeaker='Aiden')
        worker.validate(request)
        worker.synthesize(model, request)
        model.generate_custom_voice.assert_called_once_with(text='Hello', language='English', speaker='Aiden')
        model.generate_voice_clone.assert_not_called()

    def test_design_calls_design_model(self):
        request = self.request('VoiceDesign')
        request.update(mode='design', instruction='A calm deep voice')
        worker.validate(request)
        model = Mock()
        worker.synthesize(model, request)
        model.generate_voice_design.assert_called_once_with(text='Hello', language='English', instruct='A calm deep voice')

    def test_clone_requires_audio_but_transcript_is_optional(self):
        request = self.request('Base')
        request.update(mode='clone', referenceAudioPath='/missing.wav', referenceText='Hello')
        with self.assertRaisesRegex(ValueError, 'audio'):
            worker.validate(request)
        with tempfile.NamedTemporaryFile(suffix='.wav') as audio:
            request['referenceAudioPath'] = audio.name
            request['referenceText'] = ''
            worker.validate(request)
            model = Mock()
            worker.synthesize(model, request)
            model.create_voice_clone_prompt.assert_called_once_with(ref_audio=audio.name, ref_text=None, x_vector_only_mode=True)
            request['referenceText'] = 'Reference words'
            worker.validate(request)
            model = Mock()
            worker.synthesize(model, request)
            model.create_voice_clone_prompt.assert_called_once_with(ref_audio=audio.name, ref_text='Reference words', x_vector_only_mode=False)
            model.generate_voice_clone.assert_called_once_with(text='Hello', language='English', voice_clone_prompt=model.create_voice_clone_prompt.return_value)

    def test_unsupported_language_and_mode_are_rejected(self):
        for changes in ({'language': 'vi'}, {'mode': 'auto'}, {'qwenSpeaker': 'unknown'}, {'text': ' '}):
            request = self.request()
            request.update(changes)
            with self.assertRaises(ValueError):
                worker.validate(request)

    def test_cosyvoice_uses_prompt_prefix_and_all_chunks(self):
        model = Mock(sample_rate=24000)
        first, second = Mock(), Mock()
        model.inference_zero_shot.return_value = [{'tts_speech': first}, {'tts_speech': second}]
        fake_torch = Mock()
        with patch.dict('sys.modules', {'torch': fake_torch}):
            _, rate = worker.synthesize(model, {'engine': 'cosyvoice', 'text': 'Hello', 'referenceText': 'Sample', 'referenceAudioPath': 'ref.wav'})
        model.inference_zero_shot.assert_called_once_with('Hello', 'You are a helpful assistant.<|endofprompt|>Sample', 'ref.wav', stream=False, text_frontend=False)
        fake_torch.cat.assert_called_once_with([first.detach().cpu(), second.detach().cpu()], dim=1)
        self.assertEqual(rate, 24000)

    def test_cosyvoice_does_not_offer_preset_mode(self):
        request = self.request()
        request['engine'] = 'cosyvoice'
        with self.assertRaisesRegex(ValueError, 'clone'):
            worker.validate(request)

    def test_prepare_does_not_report_success_until_model_loads(self):
        download = Mock()
        request = {'command': 'prepare', 'engine': 'qwen3', 'repository': 'model', 'modelPath': '/tmp/model'}
        with patch.dict('sys.modules', {'huggingface_hub': types.SimpleNamespace(snapshot_download=download)}), patch.object(worker, 'emit'), patch.object(worker, 'load_model', side_effect=RuntimeError('missing dependency')):
            with self.assertRaisesRegex(RuntimeError, 'missing dependency'):
                worker.main(request)
        download.assert_called_once_with(repo_id='model', local_dir='/tmp/model')

    def test_source_archive_rejects_path_traversal(self):
        data = io.BytesIO()
        with zipfile.ZipFile(data, 'w') as archive:
            archive.writestr('repo/../../escape', 'bad')
        with tempfile.TemporaryDirectory() as temp, patch.object(worker.urllib.request, 'urlopen', return_value=io.BytesIO(data.getvalue())):
            with self.assertRaisesRegex(ValueError, 'archive path'):
                worker.download_source('owner/repo', 'revision', Path(temp) / 'source')

    def test_audio_result_contains_duration(self):
        request = self.request()
        request.update(command='generate', outputPath='out.wav', modelPath='model')
        sf = Mock()
        with patch.object(worker, 'load_model', return_value=(Mock(), 'cpu')), patch.object(worker, 'synthesize', return_value=([[0] * 24000], 24000)), patch.object(worker, 'emit'), patch.dict('sys.modules', {'soundfile': sf}):
            result = worker.main(request)
        self.assertEqual(result['durationSec'], 1)
        self.assertEqual(result['sampleRate'], 24000)
        sf.write.assert_called_once()

    def test_custom_17_style_is_passed_separately_from_text(self):
        request = self.request(localStyle='Speak happily')
        request['repository'] = 'Qwen/Qwen3-TTS-12Hz-1.7B-CustomVoice'
        worker.validate(request)
        model = Mock()
        worker.synthesize(model, request)
        model.generate_custom_voice.assert_called_once_with(text='Hello', language='English', speaker='Ryan', instruct='Speak happily')
        request['repository'] = 'Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice'
        with self.assertRaisesRegex(ValueError, '1.7B'):
            worker.validate(request)

    def test_cosyvoice_routes_instructions_and_audio_only(self):
        request = {'engine': 'cosyvoice', 'text': 'Hello', 'referenceText': '', 'referenceAudioPath': 'ref.wav', 'localStyle': 'Speak gently'}
        model = Mock(sample_rate=24000)
        model.inference_instruct2.return_value = [{'tts_speech': Mock()}]
        model.inference_cross_lingual.return_value = [{'tts_speech': Mock()}]
        with patch.dict('sys.modules', {'torch': Mock()}):
            worker.synthesize(model, request)
            model.inference_instruct2.assert_called_once_with('Hello', 'You are a helpful assistant. Speak gently<|endofprompt|>', 'ref.wav', stream=False, text_frontend=False)
            request['localStyle'] = ''
            worker.synthesize(model, request)
            model.inference_cross_lingual.assert_called_once_with('You are a helpful assistant.<|endofprompt|>Hello', 'ref.wav', stream=False, text_frontend=False)

    def test_model_is_loaded_once_and_replaced_on_switch(self):
        with patch.object(worker, 'load_model', return_value=(Mock(), 'cpu')) as load:
            worker.get_model({'engine': 'qwen3', 'modelPath': 'one'})
            worker.get_model({'engine': 'qwen3', 'modelPath': 'one'})
            self.assertEqual(load.call_count, 1)
            worker.get_model({'engine': 'qwen3', 'modelPath': 'two'})
            self.assertEqual(load.call_count, 2)

    def test_clone_prompt_cache_reuses_only_matching_reference(self):
        with tempfile.NamedTemporaryFile() as audio:
            request = {'referenceAudioPath': audio.name, 'referenceText': 'One'}
            model = Mock()
            worker.clone_prompt(model, request)
            worker.clone_prompt(model, request)
            self.assertEqual(model.create_voice_clone_prompt.call_count, 1)
            request['referenceText'] = 'Two'
            worker.clone_prompt(model, request)
            self.assertEqual(model.create_voice_clone_prompt.call_count, 2)

    def test_stream_emits_written_chunks_in_order(self):
        model = Mock(sample_rate=24000)
        model.inference_cross_lingual.return_value = [{'tts_speech': Mock()}, {'tts_speech': Mock()}]
        sf = Mock()
        with patch.dict('sys.modules', {'torch': Mock(), 'soundfile': sf}), patch.object(worker, 'emit') as emit:
            worker.synthesize(model, {'engine': 'cosyvoice', 'text': 'Hello', 'referenceAudioPath': 'ref.wav', 'streamPreview': True, 'outputPath': '/tmp/voice.wav'})
        self.assertEqual(sf.write.call_count, 2)
        self.assertEqual([call.kwargs['audioChunkPath'] for call in emit.call_args_list], ['/tmp/voice-chunk-1.wav', '/tmp/voice-chunk-2.wav'])
        self.assertTrue(model.inference_cross_lingual.call_args.kwargs['stream'])

    def test_server_recovers_from_bad_request_and_preserves_job_id(self):
        output = io.StringIO()
        with patch.object(worker, 'PROTOCOL', output), patch.object(worker, 'main', side_effect=[ValueError('bad'), {'success': True}]):
            worker.handle_request('{"jobId":"first"}')
            worker.handle_request('{"jobId":"second"}')
        import json
        events = [json.loads(line) for line in output.getvalue().splitlines()]
        self.assertEqual(events[0]['jobId'], 'first')
        self.assertFalse(events[0]['success'])
        self.assertEqual(events[1]['jobId'], 'second')
        self.assertTrue(events[1]['success'])

    def test_backend_change_reloads_model(self):
        with patch.object(worker, 'load_model', return_value=(Mock(), 'cpu')) as load:
            request = {'engine': 'qwen3', 'modelPath': 'one'}
            worker.get_model(request)
            worker.get_model({**request, 'backend': 'mlx'})
            self.assertEqual(load.call_count, 2)

    def test_mlx_load_preserves_fp32_and_rejects_quantized_checkpoints(self):
        model = Mock()
        mx = Mock()
        load = Mock(return_value=model)
        modules = {'mlx': types.SimpleNamespace(core=mx), 'mlx.core': mx,
                   'mlx_audio.tts.utils': types.SimpleNamespace(load_model=load)}
        with tempfile.TemporaryDirectory() as directory, patch.dict('sys.modules', modules):
            config = Path(directory) / 'config.json'
            config.write_text(json.dumps({'tts_model_type': 'voice_design'}))
            request = dict(engine='qwen3', modelPath=directory)
            self.assertIs(mlx_adapter.load_qwen_mlx(request), model)
            model.talker.set_dtype.assert_called_once_with(mx.float32)
            config.write_text(json.dumps({'tts_model_type': 'voice_design', 'quantization': {'bits': 4}}))
            with self.assertRaisesRegex(ValueError, 'unquantized'):
                mlx_adapter.load_qwen_mlx(request)
            config.write_text(json.dumps({'tts_model_type': 'base'}))
            with self.assertRaisesRegex(ValueError, 'VoiceDesign or CustomVoice'):
                mlx_adapter.load_qwen_mlx(request)

    def test_mlx_retains_generation_settings_and_combines_audio(self):
        import numpy as np
        with tempfile.TemporaryDirectory() as directory:
            config = Path(directory) / 'generation_config.json'
            config.write_text(json.dumps({'max_new_tokens': 8192, 'temperature': 0.9, 'top_k': 50,
                                         'top_p': 1.0, 'repetition_penalty': 1.05}))
            model = Mock()
            model.generate_voice_design.return_value = iter([
                types.SimpleNamespace(audio=np.zeros(240), sample_rate=24000),
                types.SimpleNamespace(audio=np.zeros(480), sample_rate=24000)])
            request = dict(modelPath=directory, text='Hello', language='en', mode='design', instruction='Young male')
            waves, rate = mlx_adapter.synthesize_qwen_mlx(model, request, worker.LANGUAGES)
            self.assertEqual(len(waves[0]), 720)
            self.assertEqual(rate, 24000)
            model.generate_voice_design.assert_called_once_with(text='Hello', language='English',
                instruct='Young male', temperature=0.9, top_k=50, top_p=1.0, repetition_penalty=1.05,
                max_tokens=8192, stream=False, verbose=False)
            model.generate_custom_voice.return_value = [types.SimpleNamespace(audio=np.zeros(240), sample_rate=24000)]
            request.update(mode='preset', qwenSpeaker='Ryan', localStyle='Speak happily')
            mlx_adapter.synthesize_qwen_mlx(model, request, worker.LANGUAGES)
            self.assertEqual(model.generate_custom_voice.call_args.kwargs['speaker'], 'Ryan')
            self.assertEqual(model.generate_custom_voice.call_args.kwargs['instruct'], 'Speak happily')
            config.write_text(json.dumps({'temperature': 0.9, 'subtalker_temperature': 0.5}))
            with self.assertRaisesRegex(ValueError, 'subtalker'):
                mlx_adapter.synthesize_qwen_mlx(model, request, worker.LANGUAGES)

    def test_mlx_invalid_audio_is_not_saved(self):
        import numpy as np
        with tempfile.TemporaryDirectory() as directory:
            (Path(directory) / 'generation_config.json').write_text('{}')
            model = Mock()
            request = dict(modelPath=directory, text='Hello', mode='design', instruction='Young male')
            model.generate_voice_design.return_value = [types.SimpleNamespace(audio=np.array([np.nan]), sample_rate=24000)]
            with self.assertRaisesRegex(RuntimeError, 'invalid audio'):
                mlx_adapter.synthesize_qwen_mlx(model, request, worker.LANGUAGES)

    def test_cosy_mps_moves_only_supported_stages_and_preserves_hift_flags(self):
        torch = Mock()
        torch.cuda.is_available.return_value = False
        torch.backends.mps.is_available.return_value = True
        cosy = Mock()
        hift = cosy.model.hift.inference
        with patch.dict('sys.modules', {'torch': torch}):
            self.assertEqual(cosy_adapter.configure_cosy_acceleration(cosy), 'mps')
        cosy.model.llm.to.assert_called_once_with(torch.device.return_value, dtype=torch.float32)
        cosy.model.flow.to.assert_called_once_with(torch.device.return_value, dtype=torch.float32)
        cosy.model.hift.to.assert_called_once_with('cpu')
        feature = Mock()
        cosy.model.hift.inference(feature, finalize=True)
        feature.to.assert_called_once_with('cpu')
        hift.assert_called_once_with(speech_feat=feature.to.return_value, finalize=True)

    def test_cosy_cuda_and_cpu_keep_the_existing_path(self):
        for cuda, expected in ((True, 'cuda'), (False, 'cpu')):
            torch = Mock()
            torch.cuda.is_available.return_value = cuda
            torch.backends.mps.is_available.return_value = False
            cosy = Mock()
            with patch.dict('sys.modules', {'torch': torch}):
                self.assertEqual(cosy_adapter.configure_cosy_acceleration(cosy), expected)
            cosy.model.llm.to.assert_not_called()
            cosy.model.hift.to.assert_not_called()

    def test_cosy_thread_failure_is_propagated_instead_of_hanging_stream(self):
        torch = Mock()
        torch.cuda.is_available.return_value = False
        torch.backends.mps.is_available.return_value = True
        cosy = Mock()
        model = cosy.model
        model.llm_end_dict = {'job': False}
        model.tts_speech_token_dict = {'job': []}
        model.hift_cache_dict = {'job': None}
        model.llm_job.side_effect = RuntimeError('unsupported GPU operation')
        with patch.dict('sys.modules', {'torch': torch}):
            cosy_adapter.configure_cosy_acceleration(cosy)
        model.llm_job(None, None, None, None, 'job')
        self.assertTrue(model.llm_end_dict['job'])
        with self.assertRaisesRegex(RuntimeError, 'unsupported GPU operation'):
            model.token2wav(uuid='job')
        self.assertEqual(model.llm_end_dict, {})
        self.assertEqual(model.tts_speech_token_dict, {})
        self.assertEqual(model.hift_cache_dict, {})

    def test_cosy_reference_cache_reuses_audio_but_invalidates_replaced_file(self):
        frontend = Mock()
        extract = frontend._extract_speech_token
        feature = types.SimpleNamespace(clone=lambda: [1, 2, 3])
        length = types.SimpleNamespace(clone=lambda: [3])
        extract.return_value = (feature, length)
        cosy_adapter.cache_reference_features(frontend)
        with tempfile.NamedTemporaryFile() as audio:
            first = frontend._extract_speech_token(audio.name)
            first[1][0] = 1  # Simulate upstream's in-place trim.
            second = frontend._extract_speech_token(audio.name)
            self.assertEqual(extract.call_count, 1)
            self.assertEqual(second, ([1, 2, 3], [3]), 'in-place trimming cannot mutate cached features/lengths')
            audio.write(b'changed')
            audio.flush()
            frontend._extract_speech_token(audio.name)
            self.assertEqual(extract.call_count, 2)
        frontend._extract_text_token('new emotion instruction')
        frontend._extract_text_token.assert_called_once_with('new emotion instruction')


if __name__ == '__main__':
    unittest.main()
