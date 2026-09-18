# logdd extension

Một extension duy nhất kết nối ứng dụng desktop với:

- Google Flow cho tạo ảnh và video Veo.
- Grok Imagine cho tạo video.

Nạp thư mục `extensions/logdd` bằng **Load unpacked** trong `chrome://extensions`.
Đăng nhập Google Flow và Grok trong cùng Chrome profile. Ứng dụng sẽ chọn adapter theo provider/model đã gán trong Cài đặt.

Google Flow: dùng extension logdd **1.1.28 trở lên**, bấm **Reload** trong
`chrome://extensions` sau khi cập nhật. Mở `https://flow.google.com/`, đăng nhập
và tạo hoặc mở một project. App tự lấy project từ các tab của profile này.
Phiên bản mới dùng phiên trình duyệt để gọi batchexecute; không cần bearer token.
Cầu nối Google Flow của logdd dùng `127.0.0.1:9224` để tránh trùng cổng Chrome CDP `9222`.
Không thay nguyên thư mục bằng FlowKit gốc vì logdd nhận phản hồi qua WebSocket
và có thêm adapter Grok. Trình duyệt được mở từ trong app sử dụng bridge riêng;
cần khởi động lại app sau khi cập nhật phần Electron.

Veo trên đường batch dùng tên model mới và clip 8 giây. Các tên cũ có `_4s`,
`_6s`, `_portrait` hoặc `_fl` không dùng cho first-frame I2V nữa. Omni vẫn có
4/6/8/10 giây. Fast trong danh sách hiện tương ứng Fast Ultra; Google có thể
từ chối model này tùy quyền của tài khoản. `MODEL_ACCESS_DENIED` là lỗi model;
`UNUSUAL_ACTIVITY` là kiểm tra bảo mật của Flow, không phải tên model sai.

Grok text-to-video hỗ trợ trực tiếp. Image-to-video hiện dùng lại ảnh đã có URL `assets.grok.com`; ảnh từ nền tảng khác sẽ báo rõ thay vì âm thầm bỏ ảnh tham chiếu.
