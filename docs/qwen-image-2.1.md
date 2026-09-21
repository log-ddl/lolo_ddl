# Qwen Image 2.1 local in LONGDD

## User flow

Open Video AI Studio → Settings → provider and model. Click **Tải Qwen Image 2.1**. The app installs a private Python environment and downloads the model into the application's user data. The model appears in the image provider selector only after installation finishes. **Gỡ model** removes this runtime and its weights. No model weights are shipped in the installer.

Image generation and editing run in a local Python process with Hugging Face offline mode enabled. Results are PNG files in the project's image storage. Existing image reference inputs are passed to the model, up to its limit of ten. Video generation continues to use the selected video provider.

## Platform requirements

| OS | Intended GPU backend | Package build |
| --- | --- | --- |
| Windows x64 | NVIDIA CUDA | `npm run build:win` |
| Linux x64 | NVIDIA CUDA | `npm run build:linux` |
| macOS Apple Silicon | PyTorch MPS | `npm run build:mac:arm64` |

The official BF16 weights are approximately 31 GiB. Installation checks for at least 50 GiB free and for a working CUDA or MPS backend before downloading the weights. Windows ARM, Intel Mac, and CPU-only generation are not supported by this integration. The model supports more accelerator types upstream, but those require their own PyTorch distributions and device tests.

The app uses 1024-class output sizes to make local inference more practical on consumer machines. CUDA uses CPU offload to reduce GPU memory pressure. Generation will still be slow on limited hardware. Each generation starts a worker process, so the model is reloaded between requests.

## Validation plan

1. Package the app on Windows x64, Linux x64, and macOS arm64. Check that `qwen-image-worker/worker.py` is included. The CI workflow runs these checks.
2. On one CUDA Windows machine, one CUDA Linux machine, and one Apple Silicon Mac, install from Settings and verify that Qwen becomes selectable only after the download completes.
3. Generate a text-only image, edit with one reference image, edit with several references, and generate a transparent PNG. Inspect the saved file and alpha channel.
4. Run a Canvas image node, Director single and batch image generation, and an AutoPilot image stage. Verify cancel, retry after an interrupted install, restart persistence, and removal.
5. Confirm that choosing Qwen never silently falls back to a cloud image provider; video generation remains separately routed.

Code compilation and package builds do not replace the GPU checks above. Do not describe the Mac or Linux inference path as verified until steps 2–4 have run on those machines.

Qwen's [research license](https://github.com/QwenLM/Qwen-Image-2.1/blob/main/LICENSE) allows research/evaluation use. Commercial use requires a separate license from Qwen.
