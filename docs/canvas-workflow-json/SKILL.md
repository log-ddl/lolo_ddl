---
name: canvas-workflow-json
description: Chuyển bộ prompt có sẵn thành file JSON workflow import vào Canvas của VideoStudio (logdd), gồm node, dây nối, bố cục và model mặc định Nano Pro. Dùng khi người dùng muốn đóng gói prompt thành workflow chưa chạy.
---

# Chuyển prompt thành Canvas JSON

## Mục tiêu

Nhận prompt từ người dùng hoặc skill khác, xuất file UTF-8 `workflow.json` import được bằng nút Import của VideoStudio → Canvas. Workflow chỉ được dựng sẵn, không chạy AI, không tiêu quota khi import. Giữ nội dung, ngôn ngữ và chi tiết prompt đã cung cấp; không tự viết lại ý tưởng hoặc gọi công cụ tạo ảnh.

Tài liệu này mô tả importer trong source `bk`, đối chiếu ngày 01/10/2026. Đây là schema riêng của ứng dụng, không phải JSON Canvas/ComfyUI/React Flow tiêu chuẩn.

## Quy trình

1. Xác định từng prompt tạo ảnh/video và ảnh nào cần dùng làm tham chiếu cho prompt khác. Nếu chỉ có danh sách prompt độc lập, tạo các node độc lập; không suy ra nối ảnh chỉ vì các prompt đứng liên tiếp.
2. Với mỗi prompt ảnh, mặc định tạo một node `imageGenerator`, ghi trực tiếp prompt vào node. Khi cần văn bản riêng để tái sử dụng/chỉnh sửa, tạo node `text` và nối vào cổng `prompt`.
3. Mặc định mọi node tạo ảnh có `model: "GEM_PIX_2"` (Nano Pro), trừ khi người dùng chỉ định model khác. Không để `model: ""` với ý nghĩa Nano Pro: chuỗi rỗng là Auto theo Settings.
4. Giữ tỷ lệ được yêu cầu. Nếu chưa có, dùng `1:1`; không tự suy ra tỷ lệ video cho mọi ảnh tài sản.
5. Nối đúng cổng theo bảng dưới. Bố trí nguồn bên trái, node phụ thuộc bên phải; gợi ý cách cột 420 px, cách hàng 420 px, để node không chồng nhau.
6. Kiểm tra JSON, ID, loại dữ liệu, vòng lặp, số lượng node và dây. Lưu file `.json` thật, trả link tải; nếu không có công cụ ghi file, trả một code block JSON hoàn chỉnh để người dùng lưu. Không đặt markdown/comment trong file JSON.

## Cấu trúc gốc

Ưu tiên dạng ngắn:

```json
{
  "version": 1,
  "name": "Tên workflow",
  "nodes": [],
  "edges": []
}
```

Importer cũng nhận `{ "version": 1, "space": { "name": "...", "nodes": [], "edges": [] }, "assets": [] }`. Không trộn các trường của `space` với dạng ngắn. File tối đa 16 MiB, 1.000 node và 5.000 dây nối.

Không khai báo `output`, `outputs`, `batchOutputs`, `textOutput`, trạng thái đang chạy hoặc lịch sử. Importer bỏ kết quả cũ, đặt `status: "idle"`, `stale: false`, rồi tạo ID mới và remap dây nối. Không cần timestamp hay ID của space.

JSON workflow không đóng gói media nhị phân. Bỏ `assets` hoặc để `[]`; không dùng `asset:0`, ID/path media bịa đặt. Nếu chưa có ảnh đầu vào thật, dùng node tạo ảnh hoặc node `localImage` trống để người dùng chọn ảnh sau import. `refs` là đường dẫn/URL ảnh thật, không phải danh sách ID node; để nối node phải dùng `edges`.

## Node

Node tạo ảnh mẫu:

```json
{
  "id": "image-hero",
  "kind": "imageGenerator",
  "name": "Nhân vật chính",
  "position": { "x": 420, "y": 0 },
  "prompt": "Nội dung prompt giữ nguyên từ đầu vào",
  "model": "GEM_PIX_2",
  "aspectRatio": "1:1"
}
```

- `id`: chuỗi không rỗng, duy nhất; dùng ID dễ đọc như `image-hero`, `scene-01`. Không dùng tên hiển thị làm dây nối nếu khác ID.
- `kind`: mã node phân biệt hoa/thường, xem bảng.
- `name`: tên hiển thị, tùy chọn.
- `position`: số `x`, `y`; nên cung cấp để bố cục có chủ đích.
- `prompt`: chuỗi, dùng `\n` cho xuống dòng và escape dấu `"` theo JSON. Giữ nguyên tiếng Việt/Anh.
- `model`: mã nội bộ, không dùng tên hiển thị như `Nano Pro`.
- `aspectRatio`: `1:1`, `16:9`, `9:16`, `4:3`, `3:4`.
- `refs`: nếu không có ảnh thật thì bỏ hoặc `[]`.
- Có thể bỏ `index`, `status`, `stale`; importer tự điền. Nếu ghi `index`, dùng số nguyên dương.

Prompt nối từ node text sẽ được ghép với prompt của node đích. Tránh lặp cùng một prompt ở cả hai nơi: nếu toàn bộ prompt nằm trong node text thì để `prompt` của node tạo ảnh trống. Không đặt `promptIsFinal: true` trừ khi chủ ý bỏ qua phần text nối vào.

## Model

| Tên hiển thị | Giá trị `model` | Dùng ở node |
|---|---|---|
| **Nano Pro — mặc định của skill** | `GEM_PIX_2` | `imageGenerator` |
| Nano 2 | `NARWHAL` | `imageGenerator` |
| Qwen Image local | `Qwen/Qwen-Image-2.1` | `imageGenerator`, chỉ khi yêu cầu và có cấu hình local |
| Tự động | chuỗi rỗng `""` | lấy cấu hình Settings, không bảo đảm Nano Pro |
| Gemini Omni Flash | `Gemini_Omni_Flash` | `videoGenerator` |
| Veo 3.1 Fast (Ultra) | `Veo_3.1-Fast` | `videoGenerator` |
| Veo 3.1 Lite | `Veo_3.1-Lite` | `videoGenerator` |
| Veo 3.1 Lite – Lower Priority | `Veo_3.1-Lite_Lower_Priority` | `videoGenerator` |

`GEM_PIX_2` là Nano **Pro**, không phải Nano 2. Nano 2 là `NARWHAL`. Model khai báo là model yêu cầu; tài khoản và fallback trong Settings vẫn có thể làm model chạy thực tế khác đi. Không tự sửa Settings hoặc gắn tài khoản trong workflow.

Nếu có video mà chưa chỉ định model, để Auto cho video; mặc định Nano Pro chỉ áp dụng tạo ảnh. Thời lượng `videoDuration`: Veo 4/6/8 giây (4/6 còn phụ thuộc tài khoản), Omni 4/6/8/10. Có thể bỏ để app chọn mặc định.

## Dây nối — `edges`

```json
{
  "id": "edge-hero-to-scene",
  "source": "image-hero",
  "target": "image-scene",
  "targetHandle": "refs"
}
```

Nghĩa là **ảnh đầu ra của `image-hero` → cổng ảnh tham chiếu của `image-scene`**. Không cần `sourceHandle`, `type`, tọa độ dây hoặc object React Flow `data`.

| Nguồn → đích | `targetHandle` | Ý nghĩa |
|---|---|---|
| `text` → `imageGenerator` | `prompt` | Văn bản làm prompt ảnh |
| `imageGenerator` → `imageGenerator` | `refs` | Ảnh trước làm tham chiếu ảnh sau |
| `localImage` → `imageGenerator` | `refs` | Ảnh tải từ máy làm tham chiếu |
| `text` hoặc `ai` → `videoGenerator` | `prompt` | Prompt video |
| Node có đầu ra ảnh → `videoGenerator` | `start` | Ảnh đầu / ảnh tham chiếu video |
| Node có đầu ra ảnh → `videoGenerator` | `end` | Ảnh cuối, trong chế độ first |
| Node có đầu ra ảnh → `imageEdit` hoặc `imageUpscale` | `refs` | Chỉnh ảnh / upscale |
| Node có đầu ra ảnh → `ai` | `refs` | Ảnh đầu vào cho node AI |
| `text` → `ai` | `prompt` | Yêu cầu AI |
| Node có đầu ra ảnh/video → `output` | `media` | Xuất media ra thư mục khi chạy |

Ràng buộc:

- `source` và `target` phải tồn tại, khác nhau; không tạo vòng lặp A → B → A.
- Loại đầu ra phải phù hợp cổng nhận: text vào `prompt`, ảnh vào `refs`/`start`/`end`. Video không nối vào `refs` của node ảnh.
- Mỗi dây có ID riêng (hoặc bỏ `id` để importer sinh); không lặp cùng dây.
- `prompt` và `refs` của node tạo ảnh nhận nhiều dây. `start`/`end` của video mặc định mỗi cổng một dây.
- Video `videoMode: "ref"` dùng cổng `start` nhận nhiều ảnh, không dùng `end`; giới hạn và khả năng hỗ trợ tùy model. Không tự tạo cổng `refs` cho video.
- Một nguồn có thể nối tới nhiều đích: tạo một edge cho mỗi cặp, không nhân bản node nguồn.
- Nối ảnh tham chiếu không tự chuyển prompt văn bản từ node ảnh trước. Mỗi ảnh sau vẫn cần prompt riêng.
- Dây mô tả phụ thuộc dữ liệu, không phải lịch chạy. Không hứa rằng bốn nhánh chạy đồng thời hoặc thêm trường `delay`/`concurrency` tự chế vào JSON.

## Các loại node khác

| `kind` | Đầu vào → đầu ra | Lưu ý |
|---|---|---|
| `text` | Không → text | Nội dung ở `prompt` |
| `localImage` / `localVideo` | Không → ảnh / video | Cần chọn file sau import nếu chưa có media |
| `reference` | `refs` ảnh (nhiều) → ảnh | Gom ảnh tham chiếu |
| `list` | `items` (nhiều) → theo `valueType` | `valueType`: `text`, `image`, `video`; `items` là mảng chuỗi |
| `router` | `items` (một dây) → theo `valueType` | `selectedItem` bắt đầu từ 0 |
| `selectResult` | `items` (nhiều) → ảnh/video | `valueType` chỉ image/video; chọn kết quả có sẵn |
| `imageEdit` | `refs` ảnh → ảnh | Chỉnh ảnh cục bộ; không phải node tạo ảnh theo prompt |
| `imageUpscale` | `refs` ảnh → ảnh | `upscaleResolution`: `2K` hoặc `4K`, cần ảnh Flow có metadata phù hợp |
| `ai` | `prompt` text + `refs` ảnh → text | `aiAdapter`: `claude`, `opencode`, `codex`; chỉ thêm khi cần xử lý AI sau import |
| `output` | `media` ảnh/video → không | Người dùng cần chọn `outputDirectory` thật trước khi chạy |
| `note` / `group` | Không → không | Ghi chú / nhóm; thành viên dùng `groupId` trỏ ID group |

Để chuyển các prompt đã hoàn chỉnh thành workflow, ưu tiên `text` và `imageGenerator`. Không tự thêm node AI để viết lại prompt.

## Ví dụ tối thiểu đầy đủ

```json
{
  "version": 1,
  "name": "Prompt sang Nano Pro",
  "nodes": [
    {
      "id": "text-1",
      "kind": "text",
      "position": { "x": 0, "y": 0 },
      "prompt": "Một chú mèo hoạt hình 2D ngồi bên cửa sổ."
    },
    {
      "id": "image-1",
      "kind": "imageGenerator",
      "position": { "x": 420, "y": 0 },
      "prompt": "",
      "model": "GEM_PIX_2",
      "aspectRatio": "16:9"
    }
  ],
  "edges": [
    { "id": "e1", "source": "text-1", "target": "image-1", "targetHandle": "prompt" }
  ]
}
```

Ví dụ đầy đủ một ảnh gốc → bốn ảnh biến thể có prompt riêng: [examples/one-to-four.json](examples/one-to-four.json). Đọc ví dụ này khi yêu cầu có phân nhánh; thay nội dung prompt theo đầu vào, không giữ nguyên nội dung minh họa nếu không liên quan.

## Kiểm tra trước khi giao

- File là JSON hợp lệ, không comment, dấu phẩy thừa, `...` hoặc placeholder chưa thay.
- Đủ các prompt người dùng đưa, không nhân đôi text nối vào và prompt tại đích.
- Mọi node tạo ảnh không được chỉ định model riêng đều ghi `GEM_PIX_2`.
- Tất cả dây đúng ID/cổng/loại và không có vòng lặp.
- Không có media hoặc kết quả giả. File import dựng sẵn workflow nhưng không tự chạy.
- Nếu có source dự án, dùng `parseWorkflowJson` trong `src/features/video-studio/canvas/json-workflow.ts` để kiểm tra bằng importer thật; không cần gọi provider. Nếu không có source, kiểm tra cấu trúc theo guide và nói rõ chưa kiểm tra bằng app.

Khi trả kết quả, đưa link file và tóm tắt số node, số dây, model; chỉ giải thích thêm khi có thiếu ảnh hoặc cấu hình cần người dùng cung cấp.
