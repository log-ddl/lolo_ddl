"""Small JSON-line bridge between Electron and the VieNeu Python SDK."""

from __future__ import annotations

import json
import os
import sys
from pathlib import Path


def emit(kind: str, **payload: object) -> None:
    print(json.dumps({"type": kind, **payload}, ensure_ascii=False), flush=True)


def create_engine(use_accelerated_backend: bool = False):
    from vieneu import Vieneu

    # Pin the desktop integration to the lightweight, deterministic CPU path.
    return Vieneu() if use_accelerated_backend else Vieneu(backend="onnx")


def main() -> None:
    request = json.loads(sys.stdin.readline())
    command = request.get("command")
    emit("progress", stage="loading", percent=10, message="Đang nạp VieNeu v3 Turbo...")
    engine = create_engine(request.get("mode") == "clone")

    if command in {"prepare", "voices"}:
        voices = engine.list_preset_voices()
        emit("result", success=True, voices=[{"label": label, "id": voice_id} for label, voice_id in voices])
        return

    if command != "generate":
        raise ValueError("Lệnh VieNeu không hợp lệ")

    text = str(request.get("text") or "").strip()
    output_path = Path(str(request.get("outputPath") or ""))
    if not text or not output_path:
        raise ValueError("Thiếu nội dung hoặc đường dẫn đầu ra")

    kwargs: dict[str, object] = {}
    mode = request.get("mode")
    if mode == "clone":
        reference = str(request.get("referenceAudioPath") or "")
        if not reference or not os.path.isfile(reference):
            raise ValueError("Không tìm thấy audio tham chiếu")
        kwargs["ref_audio"] = reference
        kwargs["denoise"] = False
    else:
        kwargs["voice"] = str(request.get("voice") or "Trúc Ly")
        style = str(request.get("style") or "tu_nhien")
        if style:
            kwargs["style"] = style

    emit("progress", stage="generating", percent=35, message="Đang tổng hợp giọng VieNeu...")
    try:
        audio = engine.infer(text, **kwargs)
    except Exception as error:
        if mode == "clone" and ("torch" in str(error).lower() or "pytorch" in str(error).lower()):
            raise RuntimeError("VieNeu voice clone cần backend PyTorch/GPU; bản CPU hiện hỗ trợ giọng dựng sẵn") from error
        raise
    output_path.parent.mkdir(parents=True, exist_ok=True)
    emit("progress", stage="saving", percent=90, message="Đang lưu WAV...")
    engine.save(audio, str(output_path))
    emit("result", success=True, outputPath=str(output_path), sampleRate=48000)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        emit("result", success=False, error=str(exc))
        sys.exit(1)
