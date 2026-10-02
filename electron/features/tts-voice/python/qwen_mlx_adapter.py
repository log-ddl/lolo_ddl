"""Apple GPU adapter using the existing, unquantized Qwen checkpoints.

Base cloning stays on the official Qwen SDK: MLX's ICL decoding currently
changes the repetition penalty, so switching it would change clone behavior.
"""
import json
from pathlib import Path


def load_qwen_mlx(request):
    import mlx.core as mx
    from mlx_audio.tts.utils import load_model

    directory = Path(request['modelPath'])
    config = json.loads((directory / 'config.json').read_text())
    if request['engine'] != 'qwen3' or config.get('tts_model_type') not in ('voice_design', 'custom_voice'):
        raise ValueError('MLX acceleration requires Qwen VoiceDesign or CustomVoice')
    if config.get('quantization') or config.get('quantization_config'):
        raise ValueError('This backend requires original, unquantized Qwen weights')
    model = load_model(directory)
    if model.tokenizer is None or model.speech_tokenizer is None:
        raise RuntimeError('Qwen tokenizer could not be loaded')
    # Match the existing CPU adapter's FP32 precision. No 4/8-bit conversion,
    # smaller checkpoint, shortened generation limit, or audio resampling.
    # The speech tokenizer checkpoint is already FP32; its compiled decoder
    # cannot be traversed by Module.set_dtype after MLX's post-load hook.
    model.talker.set_dtype(mx.float32)
    mx.eval(model.talker.parameters())
    return model


def synthesize_qwen_mlx(model, request, languages):
    import numpy as np

    config_file = Path(request['modelPath']) / 'generation_config.json'
    config = json.loads(config_file.read_text())
    # These checkpoints use identical main/subtalker sampling. Do not silently
    # discard different settings if a future model revision changes them.
    for name, default in (('temperature', 0.9), ('top_k', 50), ('top_p', 1.0)):
        if config.get('subtalker_' + name, default) != config.get(name, default):
            raise ValueError('MLX does not support different subtalker sampling settings')
    if not config.get('do_sample', True) or not config.get('subtalker_dosample', True):
        raise ValueError('MLX adapter requires the original sampling configuration')
    kwargs = dict(text=request['text'], language=languages[request.get('language', 'auto')],
                  temperature=config.get('temperature', 0.9), top_k=config.get('top_k', 50),
                  top_p=config.get('top_p', 1.0), repetition_penalty=config.get('repetition_penalty', 1.05),
                  max_tokens=config.get('max_new_tokens', 8192), stream=False, verbose=False)
    if request['mode'] == 'design':
        results = model.generate_voice_design(**kwargs, instruct=request['instruction'])
    elif request['mode'] == 'preset':
        results = model.generate_custom_voice(**kwargs, speaker=request.get('qwenSpeaker', 'Ryan'),
                                              instruct=request.get('localStyle', '').strip() or None)
    else:
        raise ValueError('MLX acceleration requires design or preset mode')
    chunks = []
    sample_rate = None
    for result in results:
        audio = np.asarray(result.audio, dtype=np.float32).reshape(-1)
        if not np.isfinite(audio).all():
            raise RuntimeError('Qwen returned invalid audio samples')
        if sample_rate is not None and result.sample_rate != sample_rate:
            raise RuntimeError('Qwen returned inconsistent sample rates')
        sample_rate = result.sample_rate
        chunks.append(audio)
    if not chunks:
        raise RuntimeError('Qwen returned no audio')
    return [np.concatenate(chunks)], sample_rate
