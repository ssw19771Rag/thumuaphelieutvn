# BÁO CÁO REVIEW DỰ ÁN WEBSITE CÔNG TY TNHH TRUNG VẠN NIÊN (TVN)

Website chính thức: **`http://thumuaphelieutvn.com`** (hoặc `http://localhost:3000`)  
Trang Quản Trị Hệ Thống: **`http://thumuaphelieutvn.com/admin`** (hoặc `http://localhost:3000/admin.html`)  
Trang Review Web: **`http://thumuaphelieutvn.com/review.html`**  
Đường truyền Internet Public: **`https://pepper-baskets-wendy-criteria.trycloudflare.com`**  
Thư mục dự án: `C:\tvn-phelieu\`

---

## 1. TỔNG QUAN THÔNG TIN DOANH NGHIỆP ĐÃ TRIỂN KHAI
- **Tên công ty**: Công ty TNHH Trung Vạn Niên
- **Tên thương hiệu**: TVN (TVN Recycling)
- **Hotline 24/7**: `0927 776 789` / `0938 333 456`
- **Địa chỉ**: Khu Công Nghiệp Châu Sơn, Phường Châu Sơn, Tỉnh Ninh Bình
- **Google Maps**: [Xem chỉ đường Google Maps](https://www.google.com/maps/search/?api=1&query=Khu+C%C3%B4ng+Nghi%E1%BB%87p+Ch%C3%A2u+S%C6%A1n,+Ph%C6%B0%E1%BB%9Dng+Ch%C3%A2u+S%C6%A1n,+Ninh+B%C3%ACnh)
- **Chuẩn SEO**: Schema LocalBusiness (`@type: RecyclingCenter`) tích hợp đầy đủ trong `<head>`

---

## 2. KIỂM THỬ CÁC TÍNH NĂNG ĐẶC BIỆT

### 2.1. Hiệu ứng Xe tải Hero chạy dọc con đường (Scroll-Linked Animation)
- Xe tải xanh lá mang logo TVN và biểu tượng tái chế (♻) chạy uốn lượn theo tuyến đường cong SVG qua 6 trạm phế liệu (Giấy, Sắt, Nhôm, Đồng, Inox, Nhựa).
- Khi người dùng cuộn chuột, xe tải di chuyển tương ứng, nghiêng nhẹ theo góc dốc tiếp tuyến, bánh xe giữ đứng yên tự nhiên và có vệt khói mờ phía sau.
- Khi đến gần mỗi trạm (< 6.5%), trạm phát sáng viền hào quang và hiện tooltip tên + giá tham khảo.
- Hỗ trợ nút "Tự động chạy / Tạm dừng" và thanh trượt scrubber mượt mà.

### 2.2. Bảng giá hiện đại tương tác theo cột (Cảm hứng phelieuducgiang.com)
- **Hiệu ứng làm nổi theo từng cột (Column Hover Highlight Effect)**:
  - Khi chuột trỏ vào bất kỳ ô nào, toàn bộ cột từ `<th>` đến `<td>` được làm sáng viền và phủ màu xanh emerald (`.col-highlighted`).
  - Khi hover vào vùng giá (Cột 4), giá tiền tự động phóng to (`scale(1.06)`), hiển thị màu sắc và đổ bóng sinh động.
- **Cột dữ liệu chi tiết**:
  - Cột 1: Loại phế liệu & Icon
  - Cột 2: Phân loại & Tiêu chuẩn quy cách
  - Cột 3: Đơn vị tính (kg / tấn)
  - Cột 4: Đơn giá hôm nay (VNĐ/kg) kèm badge xu hướng (Tăng / Ổn định)
  - Cột 5: Chiết khấu / Thưởng lô lớn (+1.000đ – 3.000đ/kg)
  - Cột 6: Nút Gọi Hotline Báo Giá (`tel:0927776789`) nhấp nháy trên từng dòng
- **Bảng Chiết Khấu & Hoa Hồng Môi Giới**:
  - Tích hợp bảng thưởng từ 3.000.000đ đến 100.000.000đ+ cho người giới thiệu và khách hàng số lượng lớn.
  - Nút gọi Hotline nhận thưởng nóng ngay lập tức.

### 2.3. Bố cục 6 bài viết ngắn kèm hình ảnh thực tế so le Trái - Phải
Phân đoạn `#nang-luc-thuc-te` có **hiệu ứng tràn ra khi lăn chuột (Expand-Reveal on Scroll)**:
1. **Kho bãi 15.000m² & Máy ép thủy lực** (`kho-quy-mo-lon-tvn.jpg` - Ảnh Trái, Bài Viết Phải)
2. **Phân loại đồng cáp & kim loại màu bằng máy quang phổ** (`phe-lieu-dong-cao-cap.jpg` - Bài Viết Trái, Ảnh Phải)
3. **Đội xe cẩu tự hành nam châm điện & xe tải lớn** (`quy-trinh-boc-do-xe-cau.jpg` - Ảnh Trái, Bài Viết Phải)
4. **Trạm cân điện tử xe tải 80 tấn kiểm định LED** (`tram-can-dien-tu-xe-tai.jpg` - Bài Viết Trái, Ảnh Phải)
5. **Tháo dỡ trọn gói xác nhà xưởng, khung kèo thép** (`thanh-ly-nha-xuong-tvn.jpg` - Ảnh Trái, Bài Viết Phải)
6. **Vệ sinh quét dọn mặt bằng sạch bóng 100% miễn phí** (`don-dep-ve-sinh-mat-bang.jpg` - Bài Viết Trái, Ảnh Phải)

### 2.4. Trang Quản Trị Hệ Thống Toàn Diện (Admin Dashboard & CRM)
- **Đường dẫn**: `http://thumuaphelieutvn.com/admin` (hoặc `http://localhost:3000/admin.html`)
- **Tài khoản quản trị mặc định**:
  - Tên đăng nhập: `admin`
  - Mật khẩu: `tvn2026@`
- **Tính năng nổi bật**:
  - **Quản lý Bảng Giá Phế Liệu**: Điều chỉnh giá hôm nay theo từng dòng, cập nhật xu hướng giá (Tăng ↗, Ổn định ➔, Giảm ↘), tăng/giảm đồng loạt ±5%, nút "Lưu & Áp Dụng Lên Website" cập nhật ngay ra trang chủ.
  - **CRM Đơn Đặt Lịch Khảo Sát**: Tự động nhận đơn gửi từ form `#bookingForm` trên trang chủ theo thời gian thực (Real-time polling 15s), hỗ trợ đổi trạng thái (Chờ gọi, Đã chốt lịch, Đã cân & thanh toán, Đã hủy), nút gọi trực tiếp (`tel:`), xem chi tiết và xuất dữ liệu ra file Excel/CSV.
  - **Báo cáo & Thống kê KPI**: 4 thẻ đo lường chính, biểu đồ cột sản lượng thu gom trong tuần, biểu đồ tròn phân bổ tỷ trọng doanh thu phế liệu.
  - **Quản lý Chính Sách Hoa Hồng**: 5 mốc thưởng hoa hồng kèm công cụ tính nhanh hoa hồng cho khách.
  - **Cấu hình Doanh Nghiệp**: Chỉnh sửa hotline 1, hotline 2, địa chỉ KCN Châu Sơn và thông báo trực tuyến đầu trang.

---

## 3. CÁCH KIỂM TRA TRỰC TIẾP
Mở trình duyệt bất kỳ (Chrome, Cốc Cốc, Edge, Firefox) và truy cập:
- **Tên miền trực tiếp (trên máy)**: `http://thumuaphelieutvn.com`
- **Trang Quản trị Hệ thống**: `http://thumuaphelieutvn.com/admin`
- **Trang Review dự án**: `http://thumuaphelieutvn.com/review.html`
- **Đường truyền Public (Cloudflare Tunnel)**:
  - Trang chủ: `https://pepper-baskets-wendy-criteria.trycloudflare.com`
  - Quản trị: `https://pepper-baskets-wendy-criteria.trycloudflare.com/admin.html`
  - Review: `https://pepper-baskets-wendy-criteria.trycloudflare.com/review.html`
