# LONGDD Workspace

LONGDD Workspace là ứng dụng desktop Electron tập hợp nhiều công cụ AI trong cùng một app shell. Các chức năng dùng chung hệ thống license, tài khoản local, ngôn ngữ, giao diện sáng/tối và bộ UI; dữ liệu và logic nghiệp vụ của từng chức năng được tách riêng để dễ mở rộng.

## Trạng thái chức năng

| Chức năng | Quyền truy cập | Trạng thái |
| --- | --- | --- |
| Video AI Studio | Theo license hiện tại | Đang hoạt động |
| Nghiên cứu – Theo dõi | Unlimited; Pro được xem giao diện | Khung chức năng |
| TTS – Tạo giọng nói | Unlimited; Pro được xem giao diện | Đã tích hợp OmniVoice local |
| Auto Edit | Unlimited; Pro được xem giao diện | Khung chức năng |

Video AI Studio hiện quản lý dự án và quy trình từ kịch bản, prompt, nhân vật, bối cảnh, đạo diễn, tạo ảnh/video đến xuất dữ liệu. Research Monitor và Auto Edit đã có route, card, lazy loading và màn hình riêng nhưng chưa có nghiệp vụ hoàn chỉnh.

## TTS Studio

TTS Studio sử dụng **OmniVoice** làm engine local duy nhất. Người dùng có thể chọn **Để sau** và tiếp tục soạn nội dung mà không tải model. Khi cài đặt, ứng dụng tải model `k2-fsa/OmniVoice` và hỗ trợ:

- Voice Clone từ audio tham chiếu 3–10 giây và transcript.
- Voice Design bằng mô tả chất giọng.
- Auto Voice để model tự chọn giọng.
- Tiếng Việt và hơn 600 ngôn ngữ.

Lần cài model đầu tiên trên Windows, app tự tải Python 3.12 runtime riêng và cài dependency vào thư mục dữ liệu ứng dụng; app không sửa `PATH` và không yêu cầu Python hệ thống. Model, runtime và audio output không được đóng vào installer hoặc repository.

Luồng kiểm thử nhanh:

1. Chạy `npm run dev:electron`, đăng nhập/hoàn tất License Gate và mở **TTS – Tạo giọng nói**.
2. Chọn **Để sau** để xác nhận UI vẫn hoạt động khi chưa có model.
3. Nhập text rồi bấm **Tải model để tạo** để kiểm tra cảnh báo.
4. Mở **Cài đặt**, tải OmniVoice và chờ trạng thái **Đã cài**.
5. Tạo Voice Profile bằng audio + transcript, tạo audio, nghe preview và thử **Xuất WAV**.
6. Kiểm tra thêm chế độ Voice Design và Auto Voice.

> Trọng số OmniVoice được phát hành theo CC BY-NC. Cần giấy phép phù hợp nếu sử dụng cho mục đích thương mại.

Yêu cầu chạy local được hỗ trợ chính thức trong app: Windows x64, NVIDIA CUDA GPU và đủ dung lượng cho runtime/model. Quá trình tải có thể hủy; model tải dở chỉ được đánh dấu sẵn sàng sau khi hoàn tất.

## Công nghệ chính

- Electron 30 và electron-vite.
- React 18 và TypeScript.
- Zustand cho state và persistence.
- Tailwind CSS 4.
- Radix UI cho dialog, tooltip và các primitive giao diện.
- FFmpeg và Whisper runtime cho xử lý media trong Video Studio.

## Chạy dự án

Yêu cầu khuyến nghị:

- Node.js 20 LTS trở lên.
- npm.
- Windows PowerShell nếu build trên Windows.

Cài dependency:

```bash
npm install
```

Chạy ứng dụng Electron trong chế độ phát triển:

```bash
npm run dev:electron
```

Chạy renderer bằng Vite khi chỉ cần kiểm tra giao diện web:

```bash
npm run dev
```

Một số API Electron và file storage không tồn tại khi chỉ chạy renderer trong trình duyệt. Khi kiểm tra đầy đủ chức năng, hãy dùng `dev:electron`.

## Biến môi trường

Không cần biến môi trường khi chạy. License được xác thực qua Supabase (xem `src/shared/lib/license-client.ts`).

Không đưa license endpoint riêng tư, API key, JWT hoặc credential thật vào tài liệu và source control. Các API provider của Video Studio được cấu hình trong giao diện ứng dụng.

## Các lệnh chính

| Lệnh | Công dụng |
| --- | --- |
| `npm run dev:electron` | Chạy Electron và renderer ở chế độ phát triển |
| `npm run dev` | Chạy riêng Vite renderer |
| `npm run lint` | Kiểm tra ESLint |
| `npm run build` | Build main, preload và renderer vào `out/` |
| `npm run build:win` | Đóng gói ứng dụng Windows |
| `npm run build:mac` | Đóng gói macOS theo kiến trúc mặc định |
| `npm run build:linux` | Đóng gói Linux |
| `npm run preview:electron` | Xem bản Electron đã build |

Build desktop được điều phối bởi `scripts/build-desktop.mjs`. Script `prebuild` dọn các artifact cũ trước khi build.

## Kiến trúc thư mục

```text
.
├─ electron/
│  ├─ main.ts
│  ├─ preload.ts
│  └─ features/
│     └─ video-studio/
│        ├─ cli-runtime.ts
│        ├─ render-pipeline.ts
│        └─ whisper-runtime.ts
├─ scripts/
├─ src/
│  ├─ app/
│  │  ├─ AppHome.tsx
│  │  └─ AppShell.tsx
│  ├─ features/
│  │  ├─ feature-registry.ts
│  │  ├─ video-studio/
│  │  ├─ research-monitor/
│  │  ├─ tts-voice/
│  │  └─ auto-edit/
│  ├─ shared/
│  │  ├─ components/
│  │  ├─ i18n/
│  │  ├─ lib/
│  │  ├─ stores/
│  │  └─ types/
│  ├─ App.tsx
│  └─ main.tsx
├─ electron.vite.config.ts
├─ package.json
└─ README.md
```

### `src/app`

Chứa app shell và trang chủ. `AppShell` chỉ chọn feature đang mở; không chứa logic nghiệp vụ của Video Studio hay các feature khác.

### `src/features`

Mỗi chức năng cấp cao có một thư mục riêng và một `entry.tsx`. Danh sách card, lazy loader và yêu cầu license được khai báo tập trung trong `src/features/feature-registry.ts`.

`src/features/video-studio` là ownership boundary của toàn bộ quy trình video, bao gồm:

- Components và panels.
- Project, script, director, media và các store liên quan.
- API Manager, Max Studio, image hosting và CLI.
- AI workflows, generation services, storage migration và worker.
- Types và package `ai-core` chỉ phục vụ Video Studio.

Không thêm feature cấp ứng dụng mới vào `Tab` của Video Studio. Feature mới phải đăng ký trong feature registry.

### `src/shared`

Chỉ chứa thành phần thật sự dùng chung:

- License gate và cache xác minh license.
- Hồ sơ tài khoản local và avatar local.
- Theme, ngôn ngữ và app navigation.
- Sidebar controls, nút logo quay về trang chủ và UI primitives.
- Các helper không phụ thuộc nghiệp vụ của một feature cụ thể.

Code trong `shared` không được import ngược từ `features/video-studio`.

### `electron/features`

Chứa backend Electron chỉ thuộc một feature. Runtime render, Whisper và CLI của Video Studio nằm trong `electron/features/video-studio` thay vì đặt chung ở Electron root.

## Thêm một chức năng cấp cao

1. Tạo thư mục `src/features/<feature-id>/` và file `entry.tsx`.
2. Thêm ID vào `AppFeatureId` trong `src/shared/stores/app-shell-store.ts`.
3. Thêm lazy loader và metadata vào `src/features/feature-registry.ts`.
4. Khai báo `requiredPlan: "unlimited"` nếu feature chỉ dành cho Unlimited.
5. Thêm tiêu đề và mô tả vào catalog `src/shared/i18n/messages/en/features.ts` và `vi/features.ts`.
6. Chuyển code dùng chung thật sự vào `src/shared`; giữ store, component và service riêng trong feature.
7. Chạy lint và production build trước khi đóng gói.

Ví dụ registry:

```ts
{
  id: "my-feature",
  titleKey: "appHome.myFeature.title",
  descriptionKey: "appHome.myFeature.description",
  icon: MyIcon,
  component: lazy(loadMyFeature),
  preload: loadMyFeature,
  requiredPlan: "unlimited",
}
```

## License và quyền truy cập

- `LicenseGate` kiểm tra license trước khi sử dụng ứng dụng.
- Kết quả hợp lệ được cache trong 24 giờ để lần mở tiếp theo không bị chặn bởi request mạng.
- Trong thời gian cache còn hiệu lực, app mở trước và xác minh lại ở nền.
- License bị khóa, sai máy, hết hạn hoặc yêu cầu cập nhật vẫn có thể khóa ứng dụng sau khi nhận kết quả xác minh.
- Thông tin tên, gói, ngày hết hạn và Machine ID được hiển thị trong popup Tài khoản.
- Avatar tài khoản được resize tối đa 256px và chỉ lưu local trên thiết bị.
- Metadata `requiredPlan` quyết định nhãn quyền của card. Thứ tự quyền là `free < pro < unlimited < dev`; Dev là gói nội bộ cao nhất và được dùng toàn bộ chức năng. Buzz trong Content Chat chỉ hiển thị cho Dev.


## Dữ liệu local

Ứng dụng sử dụng nhiều lớp persistence tùy loại dữ liệu:

- localStorage cho một số preference, license cache và hồ sơ tài khoản local.
- Zustand persist kết hợp file storage/IndexedDB cho cài đặt và dữ liệu dự án.
- Dữ liệu Video Studio được tách theo project để tránh rò dữ liệu giữa các dự án.
- Storage migration có cờ hoàn tất và chỉ chạy khi cần; recovery legacy chạy nền một lần.

Không xóa hoặc đổi persistence key nếu chưa có migration tương thích, vì có thể làm mất liên kết với dữ liệu người dùng cũ.

## Quy ước phát triển

- Dùng alias `@/` cho import từ `src`.
- Dùng catalog i18n theo domain; không dồn thêm nội dung vào một file dịch lớn.
- Popup xác nhận/thông báo phải nằm trong giao diện Electron, không dùng `window.alert` hoặc `window.confirm`.
- Không chặn lần render đầu bằng các request đồng bộ model hoặc tác vụ mạng không bắt buộc.
- Tác vụ nền phải có cache/throttle phù hợp và không làm mất dữ liệu khi người dùng đổi feature.
- Giữ UI dùng chung nhất quán bằng component trong `src/shared/components`.

## Kiểm tra trước khi phát hành

```bash
npm run lint
npm run build
```

Sau đó kiểm tra thủ công tối thiểu:

- Kích hoạt và cache license.
- Chuyển sáng/tối và Việt/Anh.
- Mở/đóng popup Tài khoản, đổi và xóa avatar.
- Điều hướng qua bốn card và quay về trang chủ bằng nút `L`.
- Tạo, mở, đổi và xóa project Video Studio.
- Build và khởi động bản Electron đóng gói.

Hiện dự án chưa có test suite tự động được khai báo trong `package.json`; lint, production build và kiểm thử Electron thủ công là các bước xác minh bắt buộc.

## Giấy phép mã nguồn

Dự án khai báo giấy phép `AGPL-3.0-or-later` trong `package.json`.
