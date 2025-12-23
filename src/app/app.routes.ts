import { Routes } from '@angular/router';
import { EcommerceComponent } from './pages/dashboard/ecommerce/ecommerce.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { FormElementsComponent } from './pages/forms/form-elements/form-elements.component';
import { BasicTablesComponent } from './pages/tables/basic-tables/basic-tables.component';
import { BlankComponent } from './pages/blank/blank.component';
import { NotFoundComponent } from './pages/other-page/not-found/not-found.component';
import { AppLayoutComponent } from './shared/layout/app-layout/app-layout.component';
import { InvoicesComponent } from './pages/invoices/invoices.component';
import { LineChartComponent } from './pages/charts/line-chart/line-chart.component';
import { BarChartComponent } from './pages/charts/bar-chart/bar-chart.component';
import { AlertsComponent } from './pages/ui-elements/alerts/alerts.component';
import { AvatarElementComponent } from './pages/ui-elements/avatar-element/avatar-element.component';
import { BadgesComponent } from './pages/ui-elements/badges/badges.component';
import { ButtonsComponent } from './pages/ui-elements/buttons/buttons.component';
import { ImagesComponent } from './pages/ui-elements/images/images.component';
import { VideosComponent } from './pages/ui-elements/videos/videos.component';
import { SignInComponent } from './pages/auth-pages/sign-in/sign-in.component';
import { SignUpComponent } from './pages/auth-pages/sign-up/sign-up.component';
import { CalenderComponent } from './pages/calender/calender.component';
import { InvoiceListComponent } from './shared/components/invoice/invoice-list/invoice-list.component';
import { BillingInvoiceTableComponent } from './shared/components/ecommerce/billing/billing-invoice-table/billing-invoice-table.component';
import { authGuard } from './shared/guards/auth.guard';
import { guestGuard } from './shared/guards/guest.guard';

import { ProductListPageComponent } from './pages/product/list/list.component';
import { AddProductPageComponent } from './pages/product/add/add.component';

import { CategoryListPageComponent } from './pages/category/list/list.component';
import { AddCategoryPageComponent } from './pages/category/add/add.component';

import { ComboListPageComponent } from './pages/combo/list/list.component';
import { AddComboPageComponent } from './pages/combo/add/add.component';
import { EditComboPageComponent } from './pages/combo/edit/edit.component';
import { EditProductPageComponent } from './pages/product/edit/edit.component';
import { EditCategoryPageComponent } from './pages/category/edit/edit.component';
import { AddRolePageComponent } from './pages/role/add/add.component';
import { RoleListPageComponent } from './pages/role/list/list.component';
import { EditRolePageComponent } from './pages/role/edit/edit.component';
import { UserListPageComponent } from './pages/user/list/list.component';
import { PermissionGuard } from './shared/guards/permission.guard';
import { ForbiddenComponent } from './pages/other-page/forbidden/forbidden.component';
import { AddCustomerPageComponent } from './pages/customer/add/add.component';
import { EditCustomerPageComponent } from './pages/customer/edit/edit.component';
import { CustomerListPageComponent } from './pages/customer/list/list.component';
import { DetailCustomerPageComponent } from './pages/customer/detail/detail.component';
import { AddOrderPageComponent } from './pages/order/add/add.component';
import { EditOrderPageComponent } from './pages/order/edit/edit.component';
import { OrderListPageComponent } from './pages/order/list/list.component';
import { DetailOrderPageComponent } from './pages/order/detail/detail.component';
import { AddCouponPageComponent } from './pages/coupon/add/add.component';
import { EditCouponPageComponent } from './pages/coupon/edit/edit.component';
import { CouponListPageComponent } from './pages/coupon/list/list.component';
import { PricePromotionListPageComponent } from './pages/price-promotion/list/list.component';
import { AddPricePromotionPageComponent } from './pages/price-promotion/add/add.component';
import { EditPricePromotionPageComponent } from './pages/price-promotion/edit/edit.component';
import { EditBlogPostPageComponent } from './pages/blog-post/edit/edit.component';
import { BlogPostListPageComponent } from './pages/blog-post/list/list.component';
import { AddBlogPostPageComponent } from './pages/blog-post/add/add.component';
import { AddBlogTagPageComponent } from './pages/blog-tag/add/add.component';
import { EditBlogTagPageComponent } from './pages/blog-tag/edit/edit.component';
import { BlogTagListPageComponent } from './pages/blog-tag/list/list.component';
import { BlogCategoryListPageComponent } from './pages/blog-category/list/list.component';
import { AddBlogCategoryPageComponent } from './pages/blog-category/add/add.component';
import { EditBlogCategoryPageComponent } from './pages/blog-category/edit/edit.component';
import { DetailBlogPostPageComponent } from './pages/blog-post/detail/detail.component';
import { PosTerminalComponent } from './shared/components/ecommerce/pos/pos-terminal/pos-terminal.component';
import { AddEmployeePageComponent } from './pages/employee/add/add.component';
import { DetailEmployeePageComponent } from './pages/employee/detail/detail.component';
import { EditEmployeePageComponent } from './pages/employee/edit/edit.component';
import { EmployeeListPageComponent } from './pages/employee/list/list.component';
import { SurchargeListPageComponent } from './pages/settings/surcharge/list/list.component';
import { SurchargeEditPageComponent } from './pages/settings/surcharge/edit/edit.component';
import { SurchargeAddPageComponent } from './pages/settings/surcharge/add/add.component';
import { DealSettingPageComponent } from './pages/settings/deal/config/config.component';

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard], // <--- bảo vệ toàn bộ bố cục ứng dụng
    children: [
      // {
      //   path: '',
      //   component: EcommerceComponent,
      //   pathMatch: 'full',
      //   title: 'Tổng quan',
      // },
      {
        path: 'category',
        children: [
          {
            path: '',
            component: CategoryListPageComponent,
            title: 'Quản lý Danh mục',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['category.read'] },
          },
          {
            path: 'add',
            component: AddCategoryPageComponent,
            pathMatch: 'full',
            title: 'Thêm Danh mục',
            canActivate: [PermissionGuard],
            data: { permissions: ['category.create'] },
          },
          {
            path: 'edit/:id',
            component: EditCategoryPageComponent,
            pathMatch: 'full',
            title: 'Chỉnh sửa Danh mục',
            canActivate: [PermissionGuard],
            data: { permissions: ['category.update'] },
          },
        ],
      },
      {
        path: 'product',
        children: [
          {
            path: '',
            component: ProductListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Sản phẩm',
            canActivate: [PermissionGuard],
            data: { permissions: ['product.read'] },
          },
          {
            path: 'add',
            component: AddProductPageComponent,
            pathMatch: 'full',
            title: 'Thêm Sản phẩm',
            canActivate: [PermissionGuard],
            data: { permissions: ['product.create'] },
          },
          {
            path: 'edit/:id',
            component: EditProductPageComponent,
            pathMatch: 'full',
            title: 'Chỉnh sửa Sản phẩm',
            canActivate: [PermissionGuard],
            data: { permissions: ['product.update'] },
          },
        ],
      },
      {
        path: 'combo',
        children: [
          {
            path: '',
            component: ComboListPageComponent,
            title: 'Quản lý Combo',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['combo.read'] },
          },
          {
            path: 'add',
            component: AddComboPageComponent,
            pathMatch: 'full',
            title: 'Thêm Combo',
            canActivate: [PermissionGuard],
            data: { permissions: ['combo.update'] },
          },
          {
            path: 'edit/:id',
            component: EditComboPageComponent,
            pathMatch: 'full',
            title: 'Chỉnh sửa Combo',
            canActivate: [PermissionGuard],
            data: { permissions: ['combo.update'] },
          },
        ],
      },
      {
        path: 'coupon',
        children: [
          {
            path: '',
            component: CouponListPageComponent,
            title: 'Quản lý Mã giảm giá',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['coupon.read'] },
          },
          {
            path: 'add',
            component: AddCouponPageComponent,
            pathMatch: 'full',
            title: 'Thêm Mã giảm giá',
            canActivate: [PermissionGuard],
            data: { permissions: ['coupon.update'] },
          },
          {
            path: 'edit/:id',
            component: EditCouponPageComponent,
            pathMatch: 'full',
            title: 'Chỉnh sửa Mã giảm giá',
            canActivate: [PermissionGuard],
            data: { permissions: ['coupon.update'] },
          },
        ],
      },
      {
        path: 'price-promotion',
        children: [
          {
            path: '',
            component: PricePromotionListPageComponent,
            title: 'Quản lý Khuyến mãi',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['pricePromotion.read'] },
          },
          {
            path: 'add',
            component: AddPricePromotionPageComponent,
            pathMatch: 'full',
            title: 'Thêm Khuyến mãi',
            canActivate: [PermissionGuard],
            data: { permissions: ['pricePromotion.update'] },
          },
          {
            path: 'edit/:id',
            component: EditPricePromotionPageComponent,
            pathMatch: 'full',
            title: 'Chỉnh sửa Khuyến mãi',
            canActivate: [PermissionGuard],
            data: { permissions: ['pricePromotion.update'] },
          },
        ],
      },
      {
        path: 'role',
        children: [
          {
            path: '',
            component: RoleListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Vai trò',
            canActivate: [PermissionGuard],
            data: { permissions: ['role.read'] },
          },
          {
            path: 'add',
            component: AddRolePageComponent,
            pathMatch: 'full',
            title: 'Thêm Vai trò',
            canActivate: [PermissionGuard],
            data: { permissions: ['role.update'] },
          },
          {
            path: 'edit/:id',
            component: EditRolePageComponent,
            pathMatch: 'full',
            title: 'Chỉnh sửa Vai trò',
            canActivate: [PermissionGuard],
            data: { permissions: ['role.update'] },
          },
        ],
      },
      {
        path: 'user',
        children: [
          {
            path: '',
            component: UserListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Người dùng',
            canActivate: [PermissionGuard],
            data: { permissions: ['user.read'] },
          },
        ],
      },
      {
        path: 'customer',
        children: [
          {
            path: '',
            component: CustomerListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Khách hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.read'] },
          },
          {
            path: 'add',
            component: AddCustomerPageComponent,
            pathMatch: 'full',
            title: 'Thêm Khách hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.update'] },
          },
          {
            path: 'edit/:id',
            component: EditCustomerPageComponent,
            title: 'Chỉnh sửa Khách hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.update'] },
          },
          {
            path: 'detail/:id',
            component: DetailCustomerPageComponent,
            title: 'Chi tiết Khách hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.read'] },
          },
        ],
      },
      {
        path: 'employee',
        children: [
          {
            path: '',
            component: EmployeeListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý nhân viên',
            canActivate: [PermissionGuard],
            data: { permissions: ['employee.read'] },
          },
          {
            path: 'add',
            component: AddEmployeePageComponent,
            pathMatch: 'full',
            title: 'Thêm nhân viên',
            canActivate: [PermissionGuard],
            data: { permissions: ['employee.update'] },
          },
          {
            path: 'edit/:id',
            component: EditEmployeePageComponent,
            title: 'Chỉnh sửa nhân viên',
            canActivate: [PermissionGuard],
            data: { permissions: ['employee.update'] },
          },
          {
            path: 'detail/:id',
            component: DetailEmployeePageComponent,
            title: 'Chi tiết nhân viên',
            canActivate: [PermissionGuard],
            data: { permissions: ['employee.read'] },
          },
        ],
      },
      {
        path: 'order',
        children: [
          {
            path: '',
            component: OrderListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Đơn hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.read'] },
          },
          {
            path: 'add',
            component: AddOrderPageComponent,
            pathMatch: 'full',
            title: 'Thêm Đơn hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.update'] },
          },
          {
            path: 'edit/:id',
            component: EditOrderPageComponent,
            title: 'Chỉnh sửa Đơn hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.update'] },
          },
          {
            path: 'detail/:id',
            component: DetailOrderPageComponent,
            title: 'Chi tiết Đơn hàng',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.read'] },
          },
        ],
      },
      {
        path: 'pos',
        component: PosTerminalComponent,
      },
      {
        path: 'blog-post',
        children: [
          {
            path: '',
            component: BlogPostListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.read'] },
          },
          {
            path: 'add',
            component: AddBlogPostPageComponent,
            pathMatch: 'full',
            title: 'Thêm Bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.update'] },
          },
          {
            path: 'edit/:id',
            component: EditBlogPostPageComponent,
            title: 'Chỉnh sửa Bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.update'] },
          },
          {
            path: 'detail/:id',
            component: DetailBlogPostPageComponent,
            title: 'Chi tiết Bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.read'] },
          },
        ],
      },
      {
        path: 'blog-tag',
        children: [
          {
            path: '',
            component: BlogTagListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Thẻ bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogTag.read'] },
          },
          {
            path: 'add',
            component: AddBlogTagPageComponent,
            pathMatch: 'full',
            title: 'Thêm Thẻ bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogTag.update'] },
          },
          {
            path: 'edit/:id',
            component: EditBlogTagPageComponent,
            title: 'Chỉnh sửa Thẻ bài viết',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogTag.update'] },
          },
        ],
      },
      {
        path: 'blog-category',
        children: [
          {
            path: '',
            component: BlogCategoryListPageComponent,
            pathMatch: 'full',
            title: 'Quản lý Danh mục Blog',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogCategory.read'] },
          },
          {
            path: 'add',
            component: AddBlogCategoryPageComponent,
            pathMatch: 'full',
            title: 'Thêm Danh mục Blog',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogCategory.update'] },
          },
          {
            path: 'edit/:id',
            component: EditBlogCategoryPageComponent,
            title: 'Chỉnh sửa Danh mục Blog',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogCategory.update'] },
          },
        ],
      },
      {
        path: 'settings',
        children: [
          {
            path: 'surcharge',
            children: [
              {
                path: '',
                component: SurchargeListPageComponent,
                pathMatch: 'full',
                title: 'Danh sách Phụ thu',
                canActivate: [PermissionGuard],
                data: { permissions: ['surcharge.read'] },
              },
              {
                path: 'add',
                component: SurchargeAddPageComponent,
                pathMatch: 'full',
                title: 'Thêm Phụ thu',
                canActivate: [PermissionGuard],
                data: { permissions: ['surcharge.create'] },
              },
              {
                path: 'edit/:id',
                component: SurchargeEditPageComponent,
                pathMatch: 'full',
                title: 'Chỉnh sửa Phụ thu',
                canActivate: [PermissionGuard],
                data: { permissions: ['surcharge.update'] },
              },
            ],
          },
          {
            path: 'deal',
            children: [
              {
                path: '',
                component: DealSettingPageComponent,
                pathMatch: 'full',
                title: 'Cấu hình Đơn hàng',
                canActivate: [PermissionGuard],
                data: { permissions: ['dealSettings.read'] },
              },
            ],
          },
        ],
      },
      {
        path: 'invoice',
        component: InvoiceListComponent,
        pathMatch: 'full',
        title: 'Quản lý Hóa đơn',
      },
      {
        path: 'billing',
        component: BillingInvoiceTableComponent,
        pathMatch: 'full',
        title: 'Quản lý Hóa đơn',
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Lịch',
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Hồ sơ cá nhân',
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Biểu mẫu',
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Bảng cơ bản',
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Trang trống',
      },
      // support tickets
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Chi tiết Hóa đơn',
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Biểu đồ Đường',
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Biểu đồ Cột',
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Thông báo',
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Hình đại diện',
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Huy hiệu',
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Buttons',
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Hình ảnh',
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Video',
      },
    ],
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [guestGuard], // <--- chỉ cho khách (guest)
    title: 'Đăng nhập',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard], // <--- chỉ cho khách (guest)
    title: 'Đăng ký',
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent,
    title: 'Từ chối truy cập',
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'Trang không tồn tại',
  },
];
