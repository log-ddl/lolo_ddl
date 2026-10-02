# logdd extension (Google Flow Bridge)

Extension kết nối ứng dụng desktop với:

- Google Flow cho tạo ảnh và video Veo.

Nạp thư mục `extensions/logdd` bằng **Load unpacked** trong `chrome://extensions`.
Đăng nhập Google Flow trong Chrome profile. Ứng dụng sẽ kết nối qua WebSocket cổng `9224`.

Google Flow: dùng extension logdd, bấm **Reload** trong `chrome://extensions` sau khi cập nhật.
Mở `https://labs.google/fx/` hoặc `https://flow.google.com/`, đăng nhập và tạo hoặc mở một project. App tự nhận diện project và quản lý batch qua extension bridge.

Veo trên đường batch dùng tên model mới và clip 8 giây. Omni hỗ trợ 4/6/8/10 giây.
Anti-hijack bypass: Sử dụng pristine reCAPTCHA bridge và Trusted Types execution được đồng bộ theo cấu trúc FlowKit mới nhất để vượt qua lỗi `PUBLIC_ERROR_UNUSUAL_ACTIVITY`.
