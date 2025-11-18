# Đánh Giá Dự Án Foody Angular Admin Dashboard

## 1. Tổng Quan Dự Án

Đây là dự án **Admin Dashboard** (Trang quản trị) cho hệ thống `dt-foody`. Dự án được xây dựng dưới dạng Single Page Application (SPA) hiện đại, phục vụ cho việc quản lý hệ thống nhà hàng, F&B hoặc thương mại điện tử.

### Công nghệ sử dụng
* **Framework:** Angular 20+ (Phiên bản rất mới).
* **Ngôn ngữ:** TypeScript.
* **Giao diện (Styling):** Tailwind CSS v4 (Utility-first CSS framework).
* **Quản lý gói:** NPM.

---

## 2. Phân Tích Cấu Trúc & Tính Năng

Dựa trên cấu trúc định tuyến (`app.routes.ts`) và các cấu hình (`package.json`, `angular.json`), hệ thống bao gồm các phân hệ chính sau:

### A. Xác thực & Bảo mật (Authentication & Security)
* **Cơ chế:** Sử dụng Guards để bảo vệ các routes.
    * `authGuard`: Yêu cầu đăng nhập để truy cập trang quản trị.
    * `guestGuard`: Chặn người dùng đã đăng nhập truy cập lại trang login/register.
    * `PermissionGuard`: Phân quyền chi tiết đến từng chức năng (Ví dụ: `category.read`, `product.create`).
* **Giao diện:** Có đầy đủ trang Đăng nhập (`SignInComponent`), Đăng ký (`SignUpComponent`) và trang báo lỗi truy cập (`ForbiddenComponent`, `403`).

### B. Các Module Quản Lý (CRUD)
Hệ thống cung cấp đầy đủ các chức năng Thêm (Add), Sửa (Edit), Xóa/Danh sách (List) cho các đối tượng nghiệp vụ:
1.  **Sản phẩm & Danh mục:** Quản lý Category, Product, Combo.
2.  **Khách hàng & Đơn hàng:** Quản lý Customer (có trang chi tiết), Order (xử lý đơn hàng).
3.  **Marketing:** Quản lý Coupon (Mã giảm giá), Price Promotion (Khuyến mãi giá).
4.  **Nội dung (CMS):** Quản lý Blog Post, Blog Tag, Blog Category.
5.  **Hệ thống:** Quản lý User (Người dùng nội bộ), Role (Vai trò/Phân quyền).

### C. Tính năng Nổi bật
* **POS (Point of Sale):** Có module `PosTerminalComponent` tích hợp sẵn để bán hàng tại quầy.
* **Thống kê (Dashboard):** Trang `EcommerceComponent` hiển thị tổng quan dữ liệu.
* **Tiện ích khác:** Lịch (`CalenderComponent`), Quản lý hóa đơn (`Invoice`), Hồ sơ cá nhân (`Profile`).

### D. Thư viện & Tooling
* **Biểu đồ:** Sử dụng `apexcharts` và `ng-apexcharts` để trực quan hóa dữ liệu.
* **Lịch:** Tích hợp `@fullcalendar/angular`.
* **Soạn thảo văn bản:** Sử dụng `@ckeditor/ckeditor5-angular`.
* **Chất lượng code:** Tích hợp chặt chẽ `eslint`, `prettier`, và `husky` để đảm bảo quy chuẩn code trước khi commit.

---

## 3. Kết Luận

Dự án **Foody Angular** có cấu trúc source code mạch lạc, phân chia module rõ ràng và áp dụng các công nghệ tiên tiến nhất hiện nay (Angular 20, Tailwind v4). Việc thiết kế sẵn hệ thống phân quyền (`PermissionGuard`) và các module nghiệp vụ cốt lõi (POS, Order, Product) giúp dự án này trở thành một nền tảng vững chắc để phát triển các hệ thống quản lý thực tế.

---

## Phụ lục: Nội dung file README.md

# Free Angular Tailwind Admin Dashboard Template - Foody Angular

Foody Angular là một **template admin dashboard miễn phí và mã nguồn mở** được xây dựng với **Angular** và **Tailwind CSS**. Nó cung cấp cho các nhà phát triển mọi thứ họ cần để tạo ra một **back-end, dashboard, hoặc admin panel** giàu tính năng, dựa trên dữ liệu cho bất kỳ loại dự án web nào.

![Foody Angular Admin Dashboard](./angular-tailwind.png)

Với Foody Angular, bạn sẽ có quyền truy cập vào một bộ đầy đủ các **thành phần UI dashboard, các yếu tố, và các trang sẵn sàng sử dụng** để xây dựng một admin panel hiện đại, chất lượng cao. Dù là cho một **ứng dụng web phức tạp** hay một **dự án gọn nhẹ**, Foody Angular được thiết kế để tăng tốc độ phát triển của bất kỳ loại dashboard và admin panel nào.

Foody tận dụng **hệ sinh thái mạnh mẽ của Angular 20+**, cùng với **TypeScript** và phong cách utility-first của **Tailwind CSS v4**. Kết hợp lại, chúng làm cho Foody Angular trở thành một nền tảng hoàn hảo để khởi chạy dashboard hoặc admin panel của bạn một cách nhanh chóng và hiệu quả.

Foody Angular đi kèm với các thành phần UI và bố cục thiết yếu để xây dựng các **dashboard và admin panel giàu tính năng, dựa trên dữ liệu**. Foody Angular được xây dựng trên:

- **Angular 20+**
- **TypeScript**
- **Tailwind CSS v4**

### Quick Links

- ✨ [Visit Website](https://tailadmin.com/)
- 🚀 [Angular Demo](https://angular-demo.tailadmin.com/)
- 📄 [Documentation](https://tailadmin.com/docs)
- ⬇️ [Download](https://tailadmin.com/download)
- 🖌️ [Figma Design File (Free Edition)](https://www.figma.com/community/file/1463141366275764364)
- ⚡ [Get PRO Version](https://tailadmin.com/pricing)

---

## Feature Comparison

| Feature                        | Free Version                    | Pro Version 🌟                                                                                                    |
| ------------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| **Dashboards** | 1 Unique Dashboard              | 7 Unique Dashboards: Analytics, Ecommerce, Marketing, SaaS, CRM, Stocks, Logistics and more (more coming soon) 📈 |
| **UI Elements and Components** | 100+ UI elements and components | Included in 500+ components and UI elements                                                                       |
| **Design Files** | Basic Figma design files        | Complete Figma design system file                                                                                 |
| **Support** | Community support               | Email support                                                                                                     |

## Installation

### Prerequisites

Trước khi bạn bắt đầu, hãy chắc chắn rằng bạn có:

- **Node.js 18.x or later** (Node.js 20.x recommended)
- **Angular CLI** được cài đặt toàn cục:

```bash
npm install -g @angular/cli
```

**Clone the repository:**
```bash
git clone [https://github.com/Foody/free-angular-admin-dashboard.git](https://github.com/Foody/free-angular-admin-dashboard.git)
```

**Install Dependencies**
```bash
npm install
# or
yarn install
```

**Start Development Server**
```bash
npm start
```
Sau đó mở: 👉 http://localhost:4200

**Angular.js Tailwind Components**
Foody Angular đi kèm với một bộ phong phú các tính năng dashboard sẵn sàng sử dụng:
- Ecommerce Dashboard với các yếu tố thiết yếu
- Thanh điều hướng bên (sidebar) hiện đại, dễ tiếp cận
- Trực quan hóa dữ liệu với các biểu đồ và đồ thị
- Quản lý hồ sơ người dùng và một trang 404 tùy chỉnh
- Bảng và biểu đồ (đường, cột, v.v.)
- Các biểu mẫu xác thực và các thành phần đầu vào có thể tái sử dụng
- Các yếu tố UI: alerts, dropdowns, modals, buttons, và nhiều hơn nữa
- Tích hợp Chế độ tối (Dark Mode) 🕶️ và nhiều hơn nữa
