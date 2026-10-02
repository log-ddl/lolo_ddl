"""Run CosyVoice3's LLM/flow on Apple GPU, retaining the original CPU vocoder."""
from collections import OrderedDict
from pathlib import Path


def cache_reference_features(frontend):
    # Cache only acoustic features. Text and emotion instructions are still
    # encoded on each request, avoiding stale transcripts/style when cloning.
    def wrap(extract):
        cache = OrderedDict()

        def cached(audio):
            if not isinstance(audio, (str, Path)):
                return extract(audio)
            path = Path(audio)
            stat = path.stat()
            key = (str(path.resolve()), stat.st_mtime_ns, stat.st_size)
            if key not in cache:
                cache[key] = extract(audio)
                if len(cache) > 8:
                    cache.popitem(last=False)
            cache.move_to_end(key)
            result = cache[key]
            # Upstream trims the feature/token lengths in place; never let
            # those mutations affect a later request using this reference.
            return tuple(item.clone() for item in result) if isinstance(result, tuple) else result.clone()

        return cached

    for name in ('_extract_speech_feat', '_extract_speech_token', '_extract_spk_embedding'):
        setattr(frontend, name, wrap(getattr(frontend, name)))


def configure_cosy_acceleration(cosy):
    import torch

    if torch.cuda.is_available():
        return 'cuda'
    if not torch.backends.mps.is_available():
        return 'cpu'
    model = cosy.model
    # Keep the checkpoint, FP32 and the original flow step count. HiFT's
    # pitch predictor uses float64, which MPS does not support.
    model.device = torch.device('mps')
    model.llm.to(model.device, dtype=torch.float32)
    model.flow.to(model.device, dtype=torch.float32)
    model.hift.to('cpu')
    hift_inference = model.hift.inference

    def cpu_hift(speech_feat, **kwargs):
        return hift_inference(speech_feat=speech_feat.to('cpu'), **kwargs)

    model.hift.inference = cpu_hift
    cache_reference_features(cosy.frontend)
    # Upstream generates tokens on a thread. Propagate its errors to the
    # caller instead of leaving streaming stuck waiting for more tokens.
    errors = {}
    llm_job = model.llm_job
    token2wav = model.token2wav

    def guarded_llm_job(text, prompt_text, speech_token, embedding, uuid):
        try:
            llm_job(text, prompt_text, speech_token, embedding, uuid)
        except Exception as exc:
            errors[uuid] = exc
        finally:
            model.llm_end_dict[uuid] = True

    def checked_token2wav(*args, **kwargs):
        uuid = kwargs['uuid']
        error = errors.pop(uuid, None)
        if error is not None:
            model.tts_speech_token_dict.pop(uuid, None)
            model.llm_end_dict.pop(uuid, None)
            model.hift_cache_dict.pop(uuid, None)
            raise RuntimeError(f'CosyVoice token generation failed: {error}') from error
        return token2wav(*args, **kwargs)

    model.llm_job = guarded_llm_job
    model.token2wav = checked_token2wav
    return 'mps'
