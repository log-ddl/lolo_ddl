"""Trusted Colab batch runner. Task archives contain data, never executable code."""
import hashlib
import json
from pathlib import Path
import sys
import zipfile


def render(root):
    import numpy as np
    import soundfile as sf
    import torch
    import local_models_worker as worker
    from huggingface_hub import snapshot_download
    if not torch.cuda.is_available():
        raise RuntimeError('Select Runtime > Change runtime type > GPU, then run again.')
    root = Path(root)
    raw = (root / 'tasks.json').read_bytes()
    manifest = json.loads(raw)
    model_path = snapshot_download(repo_id=manifest['repository'])
    source = Path('/content/logdd-cosyvoice')
    if manifest['engine'] == 'cosyvoice':
        worker.download_source('QwenAudio/CosyVoice', worker.COSY_REVISION, source)
        worker.download_source('shivammehta25/Matcha-TTS', worker.MATCHA_REVISION, source / 'third_party/Matcha-TTS')
    common = dict(engine=manifest['engine'], repository=manifest['repository'],
                  modelPath=model_path, sourcePath=str(source), streamPreview=False)
    report = dict(format='logdd-tts-results', version=1, packId=manifest['packId'],
                  requestHash=hashlib.sha256(raw).hexdigest(), jobs=[])
    out = root / 'results'
    (out / 'audio').mkdir(parents=True, exist_ok=True)
    total_bytes = 0
    for index, job in enumerate(manifest['jobs']):
        print(f"[{index + 1}/{len(manifest['jobs'])}] {job['name']}", flush=True)
        try:
            request = {**job, **common}
            if job.get('referenceAudioPath'):
                reference = (root / job['referenceAudioPath']).resolve()
                if not reference.is_relative_to(root.resolve()) or not reference.is_file():
                    raise ValueError('Invalid reference audio')
                request['referenceAudioPath'] = str(reference)
            filename = f"audio/{job['id']}.wav"
            temporary = out / f"audio/{job['id']}.partial.wav"
            rate, frames = None, 0
            writer = None
            try:
                for part_index, text in enumerate(job['parts']):
                    print(f"  Segment {part_index + 1}/{len(job['parts'])}", flush=True)
                    request['text'] = text
                    worker.validate(request)
                    model, accelerator = worker.get_model(request)
                    if accelerator != 'cuda':
                        raise RuntimeError(f'Expected CUDA, got {accelerator}')
                    with torch.inference_mode():
                        waves, sample_rate = worker.synthesize(model, request)
                    wave = np.asarray(waves[0], dtype=np.float32).reshape(-1)
                    if not len(wave) or not np.isfinite(wave).all():
                        raise ValueError('Model returned empty or invalid audio')
                    if rate is not None and rate != sample_rate:
                        raise ValueError('Sample rate changed between segments')
                    rate = sample_rate
                    gap = round(rate * 0.25) if part_index else 0
                    frames += len(wave) + gap
                    if total_bytes + frames * 2 + 44 > 240 * 1024 * 1024:
                        raise ValueError('Results exceed 240 MB; export a smaller batch')
                    if writer is None:
                        writer = sf.SoundFile(str(temporary), mode='w', samplerate=rate, channels=1, subtype='PCM_16')
                    if gap:
                        writer.write(np.zeros(gap, dtype=np.float32))
                    writer.write(wave)
                    del waves, wave
            finally:
                if writer is not None:
                    writer.close()
            if not frames:
                raise ValueError('No audio segments')
            temporary.replace(out / filename)
            data = (out / filename).read_bytes()
            total_bytes += len(data)
            report['jobs'].append(dict(id=job['id'], status='done', file=filename,
                                       sha256=hashlib.sha256(data).hexdigest()))
        except Exception as exc:
            (out / f"audio/{job['id']}.partial.wav").unlink(missing_ok=True)
            print(f'Failed: {exc}', flush=True)
            report['jobs'].append(dict(id=job['id'], status='error', error=str(exc)[:2000]))
        (out / 'results.json').write_text(json.dumps(report, ensure_ascii=False), encoding='utf-8')
    output = root / f"logdd-results-{manifest['packId']}.zip"
    with zipfile.ZipFile(output, 'w', compression=zipfile.ZIP_STORED) as archive:
        archive.write(out / 'results.json', 'results.json')
        for row in report['jobs']:
            if row['status'] == 'done':
                archive.write(out / row['file'], row['file'])
    print(f'Finished: {output}', flush=True)
    return output


if __name__ == '__main__':
    render(sys.argv[1])
