# Offline Certificate Workflow Design

**Date:** 2026-03-27

## Goal

Chuyển hệ thống sang workflow offline-first, bỏ toàn bộ phần Google Drive và Google Sheets online. Hệ thống chỉ còn:

1. Import file Excel nhiều sheet, cho phép chọn sheet để lấy dữ liệu.
2. Upload PDF nhiều trang, tách 1 trang thành 1 chứng nhận.
3. Extract thông tin, merge với dữ liệu import, review và approve thủ công.
4. Sinh và lưu `public_url` nội bộ cho từng chứng nhận đã approved.
5. Export file Excel chỉ gồm các dòng đã merge thành công, với các cột người dùng chọn và link chứng nhận public.

## Product Rules

- Không còn upload chứng nhận lên Drive.
- Không còn sync dữ liệu với Google Sheets.
- Không còn đọc header hoặc write-back cột online từ Google Sheets.
- `public_url` vẫn phải được lưu trong DB để mở lại batch sau vẫn dùng được.
- Export chỉ lấy các dòng:
  - đã merge
  - đã approved
  - có `public_url`
- Dòng chưa merge hoặc chưa approved không được xuất.

## Import Workflow

- Input Excel có thể có nhiều sheet.
- Người dùng chọn 1 hoặc nhiều sheet.
- Một mapping dùng chung cho các sheet đã chọn.
- Nếu file không có header thì hiển thị cột `A, B, C...` để map tay.
- Dữ liệu import được lưu vào DB để dùng cho match và export sau này.

## Review Workflow

- Match review là trung tâm vận hành.
- Người dùng cần:
  - tick từng dòng
  - chọn tất cả dòng đang hiển thị
  - bỏ chọn nhanh
  - approve selected
  - unapprove selected
  - áp trạng thái của dòng đầu tiên cho các dòng đang chọn
- Preview chứng nhận phải mở thẳng PDF trang đó trong tab mới từ thumbnail hoặc nút action.
- Badge approval phải đổi ngay sau thao tác và thống kê “ready for export” phải phản ánh đúng trạng thái.

## Export Workflow

- Màn export chỉ còn phục vụ:
  - xem số dòng approved
  - xem số dòng đã có public link
  - mở public link
  - xuất Excel
- Cột export gồm:
  - source columns từ file import
  - system columns còn hữu ích cho audit
- `Public Link` là cột hệ thống mặc định.
- `Drive Link` bị loại bỏ khỏi mặc định và khỏi UI.
- Workbook export vẫn giữ formatting business-ready hiện có.

## Backend Scope

- Giữ lại:
  - import file inspect/execute
  - upload/process PDF batch
  - public certificate page
  - export columns inspection
  - export workbook
  - match approve/review
- Bỏ khỏi API công khai:
  - sync Google Sheet
  - fetch sheet columns online
  - deliver batch to Drive
  - write batch links to Sheet
- Có thể giữ model/field cũ trong DB tạm thời để tránh migration phá lớn, nhưng không dùng trong workflow chính nữa.

## Frontend Scope

- Bỏ navigation và page mang nghĩa Drive.
- Thay bằng page export offline.
- Bỏ phần nhập cấu hình Sheets/Drive khỏi Competition và Settings.
- Header không còn hiển thị trạng thái kết nối Google.
- App copy phải phản ánh workflow offline-only.

## Validation And Success Criteria

- Có thể import workbook nhiều sheet và chọn sheet để lấy dữ liệu.
- Có thể upload PDF nhiều trang và tạo `CertificatePage` cho từng trang.
- Có thể review, select nhiều dòng, approve/unapprove hàng loạt.
- Có thể export Excel chỉ gồm các dòng approved đã merge.
- File export chứa `Public Link` hoạt động được.
- Không còn nút hoặc API online-sheet/drive trong flow chính của người dùng.
