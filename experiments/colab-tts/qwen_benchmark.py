"""Short CUDA TTS probe for Colab. Uses synthetic text, no user audio/files."""
import json
import time
from pathlib import Path
import importlib.metadata

import numpy as np
import soundfile as sf
import torch
from huggingface_hub import snapshot_download
from qwen_tts import Qwen3TTSModel

ROOT = Path('/content/logdd-tts-test')
OUT = ROOT / 'results'
OUT.mkdir(parents=True, exist_ok=True)
TEXT = 'Marketing turns attention into trust. Finance turns decisions into long term value.'
INSTRUCTION = 'A young adult male voice, clear and friendly, with a natural American accent.'
REPO = 'Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign'
assert torch.cuda.is_available(), 'Chưa có GPU CUDA. Chọn GPU trong Runtime > Change runtime type.'
report = {
    'model': REPO, 'gpu': torch.cuda.get_device_name(0),
    'precision': 'float32', 'attention': 'eager',
    'text': TEXT, 'instruction': INSTRUCTION,
    'versions': {name: importlib.metadata.version(name) for name in ('torch', 'qwen-tts', 'transformers')},
    'runs': [],
}
t = time.perf_counter()
model_dir = snapshot_download(REPO)
report['download_seconds'] = time.perf_counter() - t
t = time.perf_counter()
model = Qwen3TTSModel.from_pretrained(model_dir, device_map='cuda:0', dtype=torch.float32,
                                     attn_implementation='eager')
torch.cuda.synchronize()
report['load_seconds'] = time.perf_counter() - t
# Keep original weights, sampling, token limit and precision for this first test.
# GPU and MLX random generation need not produce identical voices or duration.
for i in range(3):
    torch.manual_seed(123 + i)
    torch.cuda.reset_peak_memory_stats()
    torch.cuda.synchronize()
    t = time.perf_counter()
    waves, sr = model.generate_voice_design(text=TEXT, language='English', instruct=INSTRUCTION)
    torch.cuda.synchronize()
    seconds = time.perf_counter() - t
    wave = np.asarray(waves[0], dtype=np.float32)
    assert wave.size and np.isfinite(wave).all(), 'Model returned empty or invalid audio'
    filename = f'qwen-cuda-{i + 1}.wav'
    sf.write(OUT / filename, wave, sr)
    row = dict(run=i + 1, kind='first' if i == 0 else 'warm', generation_seconds=seconds,
               audio_seconds=len(wave) / sr, rtf=seconds / (len(wave) / sr),
               sample_rate=sr, peak_gpu_gb=torch.cuda.max_memory_allocated() / 1e9, file=filename)
    report['runs'].append(row)
    (OUT / 'benchmark.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
    print(json.dumps(row), flush=True)
print('TTS_TEST_COMPLETE', flush=True)
