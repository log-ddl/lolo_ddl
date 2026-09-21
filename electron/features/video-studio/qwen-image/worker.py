"""Local Qwen Image 2.1 worker. One JSON request per process; no network at inference."""
import base64
import io
import json
import os
import sys

from PIL import Image


SIZES = {
    "1:1": (1024, 1024), "4:3": (1152, 864), "3:4": (864, 1152),
    "3:2": (1248, 832), "2:3": (832, 1248),
    "16:9": (1344, 768), "9:16": (768, 1344),
}


def read_image(value):
    if value.startswith("data:"):
        return Image.open(io.BytesIO(base64.b64decode(value.split(",", 1)[1]))).copy()
    return Image.open(value).copy()


def main():
    import torch
    from diffusers import QwenImage21Pipeline

    request = json.load(sys.stdin)
    model_dir = request["model_dir"]
    if not os.path.isfile(os.path.join(model_dir, "model_index.json")):
        raise RuntimeError("Qwen Image 2.1 is not fully installed")
    device = "cuda" if torch.cuda.is_available() else (
        "mps" if torch.backends.mps.is_available() else None
    )
    if device is None:
        raise RuntimeError("Qwen Image 2.1 requires a CUDA or Apple Silicon GPU")
    print(json.dumps({"stage": "loading", "device": device}), flush=True)
    dtype = torch.bfloat16 if device == "cuda" and torch.cuda.is_bf16_supported() else torch.float16
    pipe = QwenImage21Pipeline.from_pretrained(
        model_dir, torch_dtype=dtype,
        local_files_only=True,
    )
    if device == "cuda":
        # The encoder and diffusion transformer together exceed many consumer GPUs.
        pipe.enable_model_cpu_offload()
    else:
        pipe.to(device)
    references = [read_image(value) for value in request.get("references", [])]
    kwargs = {
        "prompt": request["prompt"],
        "num_inference_steps": 40,
        "width": SIZES.get(request.get("aspect_ratio"), SIZES["1:1"])[0],
        "height": SIZES.get(request.get("aspect_ratio"), SIZES["1:1"])[1],
    }
    if references:
        kwargs["image"] = references[0] if len(references) == 1 else references
    print(json.dumps({"stage": "generating", "device": device}), flush=True)
    image = pipe(**kwargs).images[0]
    output = request["output"]
    os.makedirs(os.path.dirname(output), exist_ok=True)
    image.save(output, format="PNG")
    print(json.dumps({"stage": "completed", "output": output}), flush=True)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(json.dumps({"stage": "error", "error": str(exc)}), flush=True)
        sys.exit(1)
