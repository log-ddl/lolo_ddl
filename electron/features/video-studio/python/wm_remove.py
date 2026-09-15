#!/usr/bin/env python3
"""
Xoa watermark sparkle Gemini tren anh da bi resize / nen lai.

Do mau logo nhieu kich thuoc o goc phai duoi, xac minh reverse alpha
va chi inpaint khi mau khop ro. Khong phu thuoc ty le hay duoi file.

    python wm_remove.py input.png -o clean.png
    python wm_remove.py input.png -o clean.png --box 1250,642,53,53
"""
import argparse
import base64
import sys

import cv2
import numpy as np
from PIL import Image

# Calibrated V2 alpha-map captures from GeminiWatermarkTool (MIT), resized to
# the exact box supplied by the renderer. Copyright (c) 2024 AllenK (Kwyshell).
# Full license: ./GeminiWatermarkTool.LICENSE
# https://github.com/allenk/GeminiWatermarkTool
V2_ALPHA_36_PNG = "iVBORw0KGgoAAAANSUhEUgAAACQAAAAkCAAAAADEa8dEAAACWElEQVR42l2UQW8bNxSEvyFXttRCgRXLjtIAToMcAgQtGrSH/v9r0aJFCwQ9JEDsQ604ii1DtmRbIqeH5e7KIggsuTt8b97bGSrwaMg/V78hNzsAqu3voPTthMFSyMgU7FYgg2C01xsZ6lneP85mh+foefAjBjsgeXiEn40z2PWp7Ugqz5N+SvsvAygAlkAODUaA8sEJJk/GWbg+aluhIWNQ1tvBBtLeK7mQN4KoLYL59auchRnmWRQISTwGpe9+UhJSjoc310IuwAYkKY3fDXIJ2RvNl0KlWVEgIUiHvwzXFoCV+4fXS9XVtelkv3g3XJdOCPI349WiaVANUtKbH/ubrvOB3J+keZawiBJkjn94GZNVumoJcjx+enNnhWCFjMbfP9vf5K7OwixWq7OzRSYoDEaTyX5OYJUJuK6s5/uL86uVfj3qyclqIaZdKyvC+jwkhATdVLt2nbmSBk8nx3023qUEVtTDdHp5p5AJw5OTwSapoyywHOP959NZJigIZx28PVLaKa7y9OPMofktQcv/1od7uUEIoEr//rMkAI6lJfnqZtTPrklb0Fv++akWCoqhaF3X83EtAhDeW/x+0eq/05Nu50f7uWi2d/vH19iIoNUTVrhdTmKWwTH9dRGNjCR1kYTCgrEQjnp/GlHroQIyCPny4EkGep//boWl4i5AdSfzh3VlenfvM43T3fmuRA6zqSSfzcOWX3fvAnH6EMP9WSmrobVzYWg2lb4sIqZ4zh2nduRzOM/FG7V/oQJZ7VUjXT1wKQPGyA7GVb3r8q0u0qqrpRbe/0CQHApT5xVtAAAAAElFTkSuQmCC"
V2_ALPHA_96_PNG = "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"


def highpass(gray):
    gray = gray.astype(np.float32)
    return gray - cv2.GaussianBlur(gray, (0, 0), 3.0)


def locate(gray, W, H, hint=None):
    """Match calibrated silhouettes across scales; aspect ratio is irrelevant.

    Search the bottom-right region in native pixels. A legacy box is only a
    hint, never permission to edit unverified pixels.
    """
    sw, sh = min(W, max(320, min(768, int(W * .4)))), min(H, max(320, min(768, int(H * .4))))
    ox, oy = W - sw, H - sh
    sub = gray[oy:, ox:].astype(np.float32)
    residual = highpass(sub)
    largest = min(192, sw - 8, sh - 8)
    if largest < 12:
        return None
    sizes = set(range(12, largest + 1, 4)) | {36, 48, 50, 64, 96}
    if hint:
        sizes.add(hint[2])
    candidates = []

    def search(size):
        if size < 12 or size > largest:
            return
        alpha = load_v2_alpha_map(size, size)
        template = highpass(alpha)
        scores = cv2.matchTemplate(residual, template, cv2.TM_CCOEFF_NORMED)
        _, score, _, (x, y) = cv2.minMaxLoc(scores)
        patch = residual[y:y + size, x:x + size]
        # Reject flat/near-white regions even if normalized correlation is high.
        amplitude = float(np.sum(patch * template) / max(float(np.sum(template ** 2)), 1e-6))
        if amplitude >= 3.0:
            candidates.append((score, ox + x, oy + y, size))

    for size in sorted(sizes):
        search(size)
    if not candidates:
        return None
    coarse = sorted(candidates, reverse=True)[:3]
    for _, _, _, size in coarse:
        for refined in range(size - 3, size + 4):
            if refined not in sizes:
                search(refined)
                sizes.add(refined)
    score, x, y, size = max(candidates)
    if score < .70:
        return None
    return x, y, size, size, float(score)


def load_v2_alpha_map(w, h):
    """Decode calibrated Gemini V2 alpha capture and resize to the exact box."""
    encoded = V2_ALPHA_36_PNG if max(w, h) <= 64 else V2_ALPHA_96_PNG
    capture_bytes = np.frombuffer(base64.b64decode(encoded), dtype=np.uint8)
    capture = cv2.imdecode(capture_bytes, cv2.IMREAD_COLOR)
    if capture is None:
        raise RuntimeError("khong doc duoc alpha map Gemini V2")

    # Capture is the white logo composited over black, therefore its brightest
    # channel is exactly alpha * 255. Use AREA when shrinking, CUBIC otherwise.
    alpha = capture.max(axis=2).astype(np.float32) / 255.0
    interpolation = cv2.INTER_AREA if w <= alpha.shape[1] and h <= alpha.shape[0] else cv2.INTER_CUBIC
    alpha = cv2.resize(alpha, (w, h), interpolation=interpolation)
    return np.clip(alpha, 0.0, 0.99)


def reverse_alpha_blend(img, x, y, w, h):
    """Undo Gemini's white alpha composite only at calibrated logo pixels."""
    H, W, _ = img.shape
    if x < 0 or y < 0 or x + w > W or y + h > H:
        raise ValueError("box watermark nam ngoai anh")

    alpha = load_v2_alpha_map(w, h)
    affected = alpha >= 0.002
    if int(affected.sum()) < 4:
        raise RuntimeError("alpha map watermark rong")

    out = img.copy()
    roi = img[y:y + h, x:x + w].astype(np.float32)
    a = alpha[..., None]
    restored = np.clip((roi - a * 255.0) / (1.0 - a), 0.0, 255.0)
    clean_roi = roi.copy()
    clean_roi[affected] = restored[affected]
    out[y:y + h, x:x + w] = np.rint(clean_roi).astype(np.uint8)
    return out, alpha, int(affected.sum())


def template_inpaint(img, x, y, w, h):
    """Remove a recompressed watermark using its calibrated silhouette only."""
    H, W, _ = img.shape
    if x < 0 or y < 0 or x + w > W or y + h > H:
        raise ValueError("box watermark nam ngoai anh")

    alpha = load_v2_alpha_map(w, h)
    # Ignore the alpha capture's near-zero compression noise, retain the whole
    # sparkle, then cover its JPEG halo by one pixel. Morphology is performed
    # inside the supplied box, so no mask can leak into nearby image content.
    local_mask = (alpha > 0.02).astype(np.uint8) * 255
    local_mask = cv2.dilate(local_mask, np.ones((3, 3), np.uint8), iterations=1)
    mask = np.zeros((H, W), np.uint8)
    mask[y:y + h, x:x + w] = local_mask

    bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
    cleaned = cv2.inpaint(bgr, mask, 2, cv2.INPAINT_TELEA)
    cleaned = cv2.cvtColor(cleaned, cv2.COLOR_BGR2RGB)
    return cleaned, int((mask > 0).sum())


def clean_detected(img, found):
    """Choose restoration by measured fit, not the file extension."""
    x, y, w, h, confidence = found
    restored, alpha, _ = reverse_alpha_blend(img, x, y, w, h)
    original_roi = img[y:y+h, x:x+w].astype(np.float32)
    restored_roi = restored[y:y+h, x:x+w].astype(np.float32)
    template = highpass(alpha)
    before = highpass(original_roi.mean(axis=2))
    after = highpass(restored_roi.mean(axis=2))
    norm = max(float(np.sum(template ** 2)), 1e-6)
    before_signal = abs(float(np.sum(before * template))) / norm
    after_signal = abs(float(np.sum(after * template))) / norm
    raw = (original_roi - alpha[..., None] * 255) / (1 - alpha[..., None])
    support = alpha > .02
    clipped = float(np.mean((raw[support] < -3) | (raw[support] > 258)))
    if after_signal < before_signal * .35 and clipped < .05:
        return restored, "verified-reverse-alpha-v2"
    # Only inpaint when the detected silhouette itself is a strong match.
    if confidence < .80:
        raise RuntimeError("STILL_WATERMARK: mau watermark khong khop du de khoi phuc; giu anh goc")
    cleaned, _ = template_inpaint(img, x, y, w, h)
    after = highpass(cleaned[y:y+h, x:x+w].mean(axis=2))
    if abs(float(np.sum(after * template))) / norm >= before_signal * .5:
        raise RuntimeError("STILL_WATERMARK: kiem tra sau xoa khong dat; giu anh goc")
    return cleaned, "verified-template-inpaint-v2"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("input")
    ap.add_argument("-o", "--output", required=True)
    ap.add_argument("--box", help="x,y,w,h neu muon")
    args = ap.parse_args()

    source = Image.open(args.input)
    source_format = (source.format or "").upper()
    img = np.asarray(source.convert("RGB"))
    rgb = img.astype(np.float32)
    H, W, _ = rgb.shape

    hint = tuple(int(v) for v in args.box.split(",")) if args.box else None
    found = locate(rgb.mean(axis=2), W, H, hint)
    if not found:
        sys.exit("STILL_WATERMARK: khong du do tin cay de xac dinh watermark; giu anh goc")
    x, y, w, h, confidence = found

    if w < 8 or h < 8:
        sys.exit("STILL_WATERMARK: box qua nho")

    print(f"watermark: ({x}, {y}) {w}x{h} | margin R={W-(x+w)} B={H-(y+h)} | confidence={confidence:.3f}")
    out, method = clean_detected(img, found)
    print(f"{method}: format={source_format or 'unknown'}")

    Image.fromarray(out).save(args.output)
    print(f"OK da luu: {args.output}")


if __name__ == "__main__":
    main()
