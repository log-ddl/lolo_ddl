"""Exercise batch handling without downloading weights or requiring a GPU."""
import contextlib
import hashlib
import json
from pathlib import Path
import sys
import tempfile
import types
import unittest
from unittest.mock import patch
import zipfile
import numpy as np
import soundfile as sf
import colab_runner


class RunnerTests(unittest.TestCase):
    def test_partial_batch_and_merge(self):
        with tempfile.TemporaryDirectory() as folder:
            root = Path(folder)
            jobs = [dict(id='good', name='Two parts', parts=['Hello.', 'Again.'], mode='design'),
                    dict(id='bad', name='Failure', parts=['Before failure.', 'fail'], mode='design'),
                    dict(id='last', name='After failure', parts=['Last.'], mode='design')]
            manifest = dict(packId='test-pack', repository='Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign', engine='qwen3', jobs=jobs)
            raw = json.dumps(manifest).encode()
            (root / 'tasks.json').write_bytes(raw)
            calls = []
            model = object()
            def synthesize(selected, request):
                self.assertIs(selected, model)
                calls.append(request['text'])
                if request['text'] == 'fail':
                    raise ValueError('GPU OOM')
                return [np.ones(2400, dtype=np.float32) * 0.1], 24000
            worker = types.SimpleNamespace(validate=lambda r: None, get_model=lambda r: (model, 'cuda'), synthesize=synthesize)
            fake_torch = types.SimpleNamespace(cuda=types.SimpleNamespace(is_available=lambda: True), inference_mode=contextlib.nullcontext)
            modules = dict(local_models_worker=worker, torch=fake_torch,
                           huggingface_hub=types.SimpleNamespace(snapshot_download=lambda **kw: '/mock/model'))
            with patch.dict(sys.modules, modules):
                output = colab_runner.render(root)
            with zipfile.ZipFile(output) as archive:
                report = json.loads(archive.read('results.json'))
                self.assertEqual(report['requestHash'], hashlib.sha256(raw).hexdigest())
                self.assertEqual([j['status'] for j in report['jobs']], ['done', 'error', 'done'])
                self.assertEqual(report['jobs'][1]['error'], 'GPU OOM')
                self.assertEqual(report['jobs'][0]['sha256'], hashlib.sha256(archive.read('audio/good.wav')).hexdigest())
            wave, rate = sf.read(root / 'results/audio/good.wav')
            self.assertEqual(rate, 24000)
            self.assertEqual(len(wave), 2400 * 2 + 6000)
            self.assertTrue(np.all(wave[2400:8400] == 0))
            self.assertFalse((root / 'results/audio/bad.partial.wav').exists())
            self.assertFalse((root / 'results/audio/bad.wav').exists())
            self.assertEqual(calls, ['Hello.', 'Again.', 'Before failure.', 'fail', 'Last.'])

    def test_cpu_rejected(self):
        modules = dict(torch=types.SimpleNamespace(cuda=types.SimpleNamespace(is_available=lambda: False)),
                       local_models_worker=types.SimpleNamespace(), huggingface_hub=types.SimpleNamespace(snapshot_download=None))
        with patch.dict(sys.modules, modules), self.assertRaisesRegex(RuntimeError, 'GPU'):
            colab_runner.render('/not-read')


if __name__ == '__main__':
    unittest.main()
