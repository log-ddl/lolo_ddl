# TTS update staging

Đây là thư mục tạm để nhận source mới trước khi nâng cấp TTS. Không chép đè trực tiếp vào `electron/features/tts-voice/vendor`.

## Cách dùng

1. Giải nén hoặc clone bản mới vào một trong các đường dẫn:
   - `update/OmniVoice`
   - `update/Voice_gemini_pro`
2. Giữ nguyên toàn bộ file version, dependency, license và changelog của source mới.
3. Yêu cầu Codex kiểm tra folder `update`. Codex sẽ so sánh API, dependency, model, worker và UI trước khi thay bản đang dùng.
4. Chỉ sau khi build và test thành công mới cập nhật `vendor/sources.json` và dọn bản trong `update`.

## Bản đang dùng

- OmniVoice runtime: `electron/features/tts-voice/vendor/omnivoice`
- Gemini runtime thực tế: `electron/features/tts-voice/gemini-runtime.ts`
- Gemini Python/PyQt tham khảo: `electron/features/tts-voice/vendor/gemini-reference`
