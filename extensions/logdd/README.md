# logdd extension

Một extension duy nhất kết nối ứng dụng desktop với:

- Google Flow cho tạo ảnh và video Veo.
- Grok Imagine cho tạo video.

Nạp thư mục `extensions/logdd` bằng **Load unpacked** trong `chrome://extensions`.
Đăng nhập Google Flow và Grok trong cùng Chrome profile. Ứng dụng sẽ chọn adapter theo provider/model đã gán trong Cài đặt.

Grok text-to-video hỗ trợ trực tiếp. Image-to-video hiện dùng lại ảnh đã có URL `assets.grok.com`; ảnh từ nền tảng khác sẽ báo rõ thay vì âm thầm bỏ ảnh tham chiếu.
