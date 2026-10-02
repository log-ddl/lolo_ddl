"""CosyVoice/Qwen3 adapter with JSON-line serving and cached model/voice prompts."""
import contextlib
import io
import json
from collections import OrderedDict
from pathlib import Path
import sys
import urllib.request
import zipfile

PROTOCOL = sys.stdout
CURRENT_JOB = None
CACHED_MODEL = None
CACHED_KEY = None
CLONE_PROMPTS = OrderedDict()
COSY_REVISION = '074ca6dc9e80a2f424f1f74b48bdd7d3fea531cc'
MATCHA_REVISION = 'dd9105b34bf2be2230f4aa1e4769fb586a3c824e'
LANGUAGES = {'auto': 'Auto', 'zh': 'Chinese', 'en': 'English', 'ja': 'Japanese',
             'ko': 'Korean', 'de': 'German', 'fr': 'French', 'ru': 'Russian',
             'pt': 'Portuguese', 'es': 'Spanish', 'it': 'Italian'}
SPEAKERS = ('Vivian', 'Serena', 'Uncle_Fu', 'Dylan', 'Eric', 'Ryan', 'Aiden', 'Ono_Anna', 'Sohee')


def emit(kind, **values):
    print(json.dumps({'type': kind, 'jobId': CURRENT_JOB, **values}, ensure_ascii=False), file=PROTOCOL, flush=True)


def download_source(repository, revision, destination):
    destination = Path(destination)
    marker = destination / '.revision'
    if marker.exists() and marker.read_text() == revision:
        return
    url = f'https://codeload.github.com/{repository}/zip/{revision}'
    with urllib.request.urlopen(url, timeout=120) as response:
        archive = zipfile.ZipFile(io.BytesIO(response.read()))
    for member in archive.infolist():
        relative = Path(*Path(member.filename).parts[1:])
        target = (destination / relative).resolve()
        if not target.is_relative_to(destination.resolve()):
            raise ValueError('Invalid source archive path')
        if member.is_dir():
            target.mkdir(parents=True, exist_ok=True)
        else:
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_bytes(archive.read(member))
    marker.write_text(revision)


def load_model(request):
    if request.get('backend') == 'mlx':
        from qwen_mlx_adapter import load_qwen_mlx
        return load_qwen_mlx(request), 'mlx'
    import torch
    # Qwen Base keeps the official SDK's CUDA/CPU path.
    device = 'cuda:0' if torch.cuda.is_available() else 'cpu'
    if request['engine'] == 'qwen3':
        from qwen_tts import Qwen3TTSModel
        model = Qwen3TTSModel.from_pretrained(
            request['modelPath'], device_map=device,
            dtype=torch.bfloat16 if device.startswith('cuda') and torch.cuda.is_bf16_supported() else torch.float32,
            attn_implementation='eager',
        )
    else:
        source = Path(request['sourcePath'])
        sys.path[:0] = [str(source), str(source / 'third_party' / 'Matcha-TTS')]
        from cosyvoice.cli.cosyvoice import AutoModel
        model = AutoModel(model_dir=request['modelPath'], load_trt=False, load_vllm=False, fp16=False)
        from cosy_mps_adapter import configure_cosy_acceleration
        return model, configure_cosy_acceleration(model)
    return model, 'cuda' if device.startswith('cuda') else 'cpu'


def get_model(request):
    global CACHED_MODEL, CACHED_KEY
    key = (request['engine'], request['modelPath'], request.get('backend'))
    if key != CACHED_KEY:
        CACHED_MODEL = None
        CACHED_KEY = None
        CLONE_PROMPTS.clear()
        CACHED_MODEL = load_model(request)
        CACHED_KEY = key
    return CACHED_MODEL


def clone_prompt(model, request):
    audio = Path(request['referenceAudioPath'])
    stat = audio.stat()
    transcript = request.get('referenceText', '').strip()
    key = (str(audio.resolve()), stat.st_mtime_ns, stat.st_size, transcript)
    if key not in CLONE_PROMPTS:
        CLONE_PROMPTS[key] = model.create_voice_clone_prompt(
            ref_audio=str(audio), ref_text=transcript or None,
            x_vector_only_mode=not bool(transcript))
        if len(CLONE_PROMPTS) > 8:
            CLONE_PROMPTS.popitem(last=False)
    CLONE_PROMPTS.move_to_end(key)
    return CLONE_PROMPTS[key]


def validate(request):
    engine = request.get('engine')
    if engine not in ('qwen3', 'cosyvoice'):
        raise ValueError('Unsupported TTS engine')
    if not request.get('text', '').strip():
        raise ValueError('Text is required')
    mode = request.get('mode')
    if engine == 'cosyvoice':
        allowed = 'clone'
    else:
        variant = request['repository'].rsplit('-', 1)[-1]
        allowed = {'Base': 'clone', 'CustomVoice': 'preset', 'VoiceDesign': 'design'}.get(variant)
    if mode != allowed:
        raise ValueError(f'This model requires {allowed} mode')
    if mode == 'clone':
        if not request.get('referenceAudioPath') or not Path(request['referenceAudioPath']).is_file():
            raise ValueError('Reference audio is required')
    if mode == 'design' and not request.get('instruction', '').strip():
        raise ValueError('Voice description is required')
    if engine == 'qwen3':
        if request.get('language', 'auto') not in LANGUAGES:
            raise ValueError('Qwen3-TTS does not support this language')
        if mode == 'preset' and '-0.6B-' in request['repository'] and request.get('localStyle', '').strip():
            raise ValueError('Emotion instructions require Qwen3 CustomVoice 1.7B')
        if mode == 'preset' and request.get('qwenSpeaker', 'Ryan') not in SPEAKERS:
            raise ValueError('Unknown Qwen3 speaker')


def synthesize(model, request):
    if request.get('backend') == 'mlx':
        from qwen_mlx_adapter import synthesize_qwen_mlx
        return synthesize_qwen_mlx(model, request, LANGUAGES)
    style = request.get('localStyle', '').strip()
    if request['engine'] == 'qwen3':
        kwargs = {'text': request['text'], 'language': LANGUAGES[request.get('language', 'auto')]}
        if request['mode'] == 'clone':
            return model.generate_voice_clone(**kwargs, voice_clone_prompt=clone_prompt(model, request))
        if request['mode'] == 'design':
            return model.generate_voice_design(**kwargs, instruct=request['instruction'])
        if style:
            kwargs['instruct'] = style
        return model.generate_custom_voice(**kwargs, speaker=request.get('qwenSpeaker', 'Ryan'))
    import torch
    prefix = 'You are a helpful assistant.'
    reference = request['referenceAudioPath']
    transcript = request.get('referenceText', '').strip()
    options = {'stream': bool(request.get('streamPreview')), 'text_frontend': False}
    if style:
        parts = model.inference_instruct2(request['text'], prefix + ' ' + style + '<|endofprompt|>', reference, **options)
    elif transcript:
        parts = model.inference_zero_shot(request['text'], prefix + '<|endofprompt|>' + transcript, reference, **options)
    else:
        parts = model.inference_cross_lingual(prefix + '<|endofprompt|>' + request['text'], reference, **options)
    chunks = []
    for part in parts:
        chunk = part['tts_speech'].detach().cpu()
        chunks.append(chunk)
        if options['stream']:
            import soundfile as sf
            output = Path(request['outputPath'])
            chunk_path = output.with_name(output.stem + f'-chunk-{len(chunks)}.wav')
            sf.write(str(chunk_path), chunk.squeeze(0).numpy(), model.sample_rate)
            emit('progress', stage='generating', message='Audio ready', audioChunkPath=str(chunk_path))
    if not chunks:
        raise ValueError('CosyVoice returned no audio')
    return [torch.cat(chunks, dim=1).squeeze(0).numpy()], model.sample_rate


def main(request):
    if request['command'] == 'prepare':
        if request['engine'] == 'cosyvoice':
            emit('progress', stage='runtime.dependencies', percent=40, message='Downloading CosyVoice source…')
            download_source('QwenAudio/CosyVoice', COSY_REVISION, request['sourcePath'])
            download_source('shivammehta25/Matcha-TTS', MATCHA_REVISION,
                            Path(request['sourcePath']) / 'third_party' / 'Matcha-TTS')
        from huggingface_hub import snapshot_download
        emit('progress', stage='model.download', percent=50, message='Downloading model weights…')
        snapshot_download(repo_id=request['repository'], local_dir=request['modelPath'])
        emit('progress', stage='model.download', percent=90, message='Checking model runtime…')
        _, accelerator = load_model(request)
        return {'success': True, 'accelerator': accelerator}
    if request['command'] != 'generate':
        raise ValueError('Unknown worker command')
    validate(request)
    emit('progress', stage='loading', percent=10, message='Loading model…')
    model, accelerator = get_model(request)
    emit('progress', stage='generating', percent=30, message='Generating speech…')
    waves, sample_rate = synthesize(model, request)
    import soundfile as sf
    if not waves or len(waves[0]) == 0:
        raise ValueError('Model returned no audio')
    sf.write(request['outputPath'], waves[0], sample_rate)
    return {'success': True, 'sampleRate': sample_rate, 'durationSec': len(waves[0]) / sample_rate,
            'accelerator': accelerator}


def handle_request(line):
    global CURRENT_JOB
    try:
        payload = json.loads(line)
        CURRENT_JOB = payload.get('jobId')
        with contextlib.redirect_stdout(sys.stderr):
            result = main(payload)
        emit('result', **result)
    except Exception as exc:
        emit('result', success=False, error=str(exc))
    finally:
        CURRENT_JOB = None


if __name__ == '__main__':
    if '--serve' in sys.argv:
        for line in sys.stdin:
            if line.strip():
                handle_request(line)
    else:
        handle_request(sys.stdin.readline())
