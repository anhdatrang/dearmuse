# Tài liệu Chức năng: Quản lý chi tiết gói chụp con trong dịch vụ Admin (Dear Musé)

Tài liệu này ghi chép lại toàn bộ các thay đổi và cấu trúc kỹ thuật khi triển khai tính năng quản lý ảnh mẫu, giá và dịch vụ chi tiết của từng gói chụp con (pricing) trong trang quản trị Admin.

---

## 1. Tóm tắt tính năng
Trước đây, các Concept lớn (dịch vụ lớn) chỉ lưu trữ thông tin chung và bảng giá gói chụp con ở dạng văn bản đơn giản. 
Tính năng mới cho phép admin:
* Quản lý nhiều gói chụp con bên trong một Concept dịch vụ lớn.
* Thiết lập giá tiền, tên và các đặc quyền đi kèm riêng cho từng gói chụp con.
* **Tải lên nhiều ảnh mẫu (gallery) riêng cho từng gói chụp con** bằng cách chọn file độc lập.
* Xem trước danh sách ảnh cũ dưới dạng Thumbnail và hỗ trợ xóa nhanh ảnh bằng nút xóa (`×`).
* Tự động đặt ảnh đầu tiên trong gallery làm ảnh đại diện (`coverImage`) cho gói chụp con đó.

---

## 2. Thay đổi cấu trúc Cơ sở dữ liệu (Database Schema)
Trường `pricing` trong bảng `services` trước đây chỉ lưu trữ dạng thô, nay được chuẩn hóa thành một mảng đối tượng JSON. Mỗi đối tượng trong mảng `pricing` đại diện cho một gói chụp con với các trường thông tin:

```json
[
  {
    "id": "1719999999999",
    "name": "Gói Premium",
    "price": 3500000,
    "features": "15 ảnh chỉnh sửa, Trả toàn bộ file gốc, Hỗ trợ makeup",
    "gallery": [
      "/uploads/services/1719999999999-photo1.jpg",
      "/uploads/services/1719999999999-photo2.jpg"
    ],
    "coverImage": "/uploads/services/1719999999999-photo1.jpg"
  }
]
```

---

## 3. Chi tiết thay đổi Code

### 3.1. Backend Controller: [adminServiceController.js](file:///d:/EXE201/dearmuse/controllers/adminServiceController.js)
* **Middleware upload động**: Thay đổi phương thức upload từ `upload.fields(...)` (chỉ chấp nhận các trường cố định) sang `upload.any()` để chấp nhận bất kỳ tệp tin nào được gửi lên từ các input file động của từng gói chụp con.
* **Logic lưu trữ & Cập nhật (`createService` / `updateService`)**:
  * Đọc danh sách các ID của gói chụp con từ trường `pricing_id[]`.
  * Nhận danh sách đường dẫn ảnh cũ còn giữ lại từ trường ẩn `pricing_gallery_json[]` (được gửi lên dưới dạng chuỗi JSON).
  * Kiểm tra các file ảnh mới được tải lên. Các file này được nhóm trong `req.files` với tên trường có cấu trúc `package_files_${pkgId}` (ví dụ: `package_files_1719999999999`).
  * Thực hiện gộp mảng ảnh cũ và ảnh mới tải lên vào trường `gallery` của gói đó.
  * Tự động lấy phần tử ảnh đầu tiên làm `coverImage`.
  * Lưu mảng dữ liệu gói chụp vào cột `pricing` trong cơ sở dữ liệu.

### 3.2. Giao diện Frontend Admin Form: [form.ejs](file:///d:/EXE201/dearmuse/views/admin/services/form.ejs)
* **Input File động cho từng gói**: 
  * Mỗi thẻ gói chụp con có một thẻ `<input type="file" name="package_files_${pkgId}" multiple ...>` để tải lên nhiều ảnh cùng lúc cho gói đó.
* **Hiển thị danh sách ảnh cũ dạng Thumbnail**:
  * Các ảnh hiện có được hiển thị thành hàng dạng thumbnail nhỏ kích thước `80x80px` bo góc nhẹ.
  * Mỗi thumbnail có nút xóa `×` màu đỏ ở góc.
* **Tích hợp Javascript xử lý sự kiện**:
  * Hàm `removePkgImage(btn, imgPath)`: Khi nhấn nút xóa ảnh mẫu, hàm này sẽ tìm thẻ input ẩn `pricing_gallery_json[]` tương ứng của gói chụp đó, lọc bỏ đường dẫn ảnh bị xóa khỏi mảng JSON và xóa thẻ thumbnail khỏi màn hình.
  * Hàm `addPackage()`: Khi nhấn **"Thêm Gói Chụp Mới"**, hàm sẽ tự tạo một ID duy nhất dựa trên timestamp/UUID để làm khóa liên kết, đảm bảo input tải file và dữ liệu của gói mới không bị trùng lặp với các gói hiện có.

---

## 4. Quy trình Vận hành & Kiểm thử
1. Truy cập trang quản trị dịch vụ: `/admin/services`.
2. Chọn **"Chỉnh sửa"** một Concept dịch vụ bất kỳ hoặc nhấn **"Thêm mới dịch vụ"**.
3. Cuộn xuống phần **"Các gói chụp & Bảng giá"**:
   * Tại mỗi thẻ gói chụp, bạn có thể tải lên nhiều ảnh cùng lúc thông qua trường chọn ảnh mẫu.
   * Để xóa ảnh cũ, click vào dấu `×` màu đỏ trên thumbnail của ảnh đó.
   * Nhấn **"Thêm Gói Chụp Mới"** để tạo thêm gói con mới hoàn toàn với trường tải ảnh mẫu độc lập.
4. Nhấn **"Lưu thay đổi"** ở cuối trang. Hệ thống sẽ xử lý tải lên các tệp tin mới, gộp dữ liệu ảnh mẫu cũ/mới và cập nhật thông tin thành công.
