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
import { AddUserPageComponent } from './pages/user/add/add.component';
import { EditUserPageComponent } from './pages/user/edit/edit.component';
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

export const routes: Routes = [
  {
    path: '',
    component: AppLayoutComponent,
    canActivate: [authGuard], // <--- bảo vệ toàn bộ app layout
    children: [
      {
        path: '',
        component: EcommerceComponent,
        pathMatch: 'full',
        title: 'Ecommerce Dashboard',
      },
      {
        path: 'category',
        children: [
          {
            path: '',
            component: CategoryListPageComponent,
            title: 'Category Management',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['category.read'] },
          },
          {
            path: 'add',
            component: AddCategoryPageComponent,
            pathMatch: 'full',
            title: 'Add Category Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['category.create'] },
          },
          {
            path: 'edit/:id',
            component: EditCategoryPageComponent,
            pathMatch: 'full',
            title: 'Edit Category Management',
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
            title: 'Product Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['product.read'] },
          },
          {
            path: 'add',
            component: AddProductPageComponent,
            pathMatch: 'full',
            title: 'Add Product Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['product.create'] },
          },
          {
            path: 'edit/:id',
            component: EditProductPageComponent,
            pathMatch: 'full',
            title: 'Edit Product Management',
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
            title: 'Combo Management',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['combo.read'] },
          },
          {
            path: 'add',
            component: AddComboPageComponent,
            pathMatch: 'full',
            title: 'Add Combo Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['combo.update'] },
          },
          {
            path: 'edit/:id',
            component: EditComboPageComponent,
            pathMatch: 'full',
            title: 'Edit Combo Management',
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
            title: 'Coupon Management',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['coupon.read'] },
          },
          {
            path: 'add',
            component: AddCouponPageComponent,
            pathMatch: 'full',
            title: 'Add Coupon Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['coupon.update'] },
          },
          {
            path: 'edit/:id',
            component: EditCouponPageComponent,
            pathMatch: 'full',
            title: 'Edit Coupon Management',
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
            title: 'Promotion Management',
            pathMatch: 'full',
            canActivate: [PermissionGuard],
            data: { permissions: ['pricePromotion.read'] },
          },
          {
            path: 'add',
            component: AddPricePromotionPageComponent,
            pathMatch: 'full',
            title: 'Add Promotion Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['pricePromotion.update'] },
          },
          {
            path: 'edit/:id',
            component: EditPricePromotionPageComponent,
            pathMatch: 'full',
            title: 'Edit Promotion Management',
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
            title: 'Role Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['role.read'] },
          },
          {
            path: 'add',
            component: AddRolePageComponent,
            pathMatch: 'full',
            title: 'Add Role Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['role.update'] },
          },
          {
            path: 'edit/:id',
            component: EditRolePageComponent,
            pathMatch: 'full',
            title: 'Edit Role Management',
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
            title: 'User Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['user.read'] },
          },
          {
            path: 'add',
            component: AddUserPageComponent,
            pathMatch: 'full',
            title: 'Add User Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['user.update'] },
          },
          {
            path: 'edit/:id',
            component: EditUserPageComponent,
            title: 'Edit User Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['user.update'] },
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
            title: 'Customer Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.read'] },
          },
          {
            path: 'add',
            component: AddCustomerPageComponent,
            pathMatch: 'full',
            title: 'Add Customer Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.update'] },
          },
          {
            path: 'edit/:id',
            component: EditCustomerPageComponent,
            title: 'Edit Customer Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.update'] },
          },
          {
            path: 'detail/:id',
            component: DetailCustomerPageComponent,
            title: 'Detail Customer Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['customer.read'] },
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
            title: 'Order Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.read'] },
          },
          {
            path: 'add',
            component: AddOrderPageComponent,
            pathMatch: 'full',
            title: 'Add Order Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.update'] },
          },
          {
            path: 'edit/:id',
            component: EditOrderPageComponent,
            title: 'Edit Order Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.update'] },
          },
          {
            path: 'detail/:id',
            component: DetailOrderPageComponent,
            title: 'detail Order Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['order.read'] },
          },
        ],
      },
      {
        path: 'blog-post',
        children: [
          {
            path: '',
            component: BlogPostListPageComponent,
            pathMatch: 'full',
            title: 'Blog Post Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.read'] },
          },
          {
            path: 'add',
            component: AddBlogPostPageComponent,
            pathMatch: 'full',
            title: 'Add Blog Post Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.update'] },
          },
          {
            path: 'edit/:id',
            component: EditBlogPostPageComponent,
            title: 'Edit Blog Post Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogPost.update'] },
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
            title: 'BlogTag Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogTag.read'] },
          },
          {
            path: 'add',
            component: AddBlogTagPageComponent,
            pathMatch: 'full',
            title: 'Add Blog Tag Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogTag.update'] },
          },
          {
            path: 'edit/:id',
            component: EditBlogTagPageComponent,
            title: 'Edit Blog Tag Management',
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
            title: 'BlogCategory Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogCategory.read'] },
          },
          {
            path: 'add',
            component: AddBlogCategoryPageComponent,
            pathMatch: 'full',
            title: 'Add Blog Category Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogCategory.update'] },
          },
          {
            path: 'edit/:id',
            component: EditBlogCategoryPageComponent,
            title: 'Edit Blog Category Management',
            canActivate: [PermissionGuard],
            data: { permissions: ['blogCategory.update'] },
          },
        ],
      },
      {
        path: 'invoice',
        component: InvoiceListComponent,
        pathMatch: 'full',
        title: 'Invoice Management',
      },
      {
        path: 'billing',
        component: BillingInvoiceTableComponent,
        pathMatch: 'full',
        title: 'Invoice Management',
      },
      {
        path: 'calendar',
        component: CalenderComponent,
        title: 'Calender',
      },
      {
        path: 'profile',
        component: ProfileComponent,
        title: 'Profile Dashboard',
      },
      {
        path: 'form-elements',
        component: FormElementsComponent,
        title: 'Form Elements Dashboard',
      },
      {
        path: 'basic-tables',
        component: BasicTablesComponent,
        title: 'Basic Tables Dashboard',
      },
      {
        path: 'blank',
        component: BlankComponent,
        title: 'Blank Dashboard',
      },
      // support tickets
      {
        path: 'invoice',
        component: InvoicesComponent,
        title: 'Invoice Details Dashboard',
      },
      {
        path: 'line-chart',
        component: LineChartComponent,
        title: 'Line Chart Dashboard',
      },
      {
        path: 'bar-chart',
        component: BarChartComponent,
        title: 'Bar Chart Dashboard',
      },
      {
        path: 'alerts',
        component: AlertsComponent,
        title: 'Alerts Dashboard',
      },
      {
        path: 'avatars',
        component: AvatarElementComponent,
        title: 'Avatars Dashboard',
      },
      {
        path: 'badge',
        component: BadgesComponent,
        title: 'Badges Dashboard',
      },
      {
        path: 'buttons',
        component: ButtonsComponent,
        title: 'Buttons Dashboard',
      },
      {
        path: 'images',
        component: ImagesComponent,
        title: 'Images Dashboard',
      },
      {
        path: 'videos',
        component: VideosComponent,
        title: 'Videos Dashboard',
      },
    ],
  },
  // auth pages
  {
    path: 'signin',
    component: SignInComponent,
    canActivate: [guestGuard], // <--- chỉ cho guest
    title: 'Sign In Dashboard',
  },
  {
    path: 'signup',
    component: SignUpComponent,
    canActivate: [guestGuard], // <--- chỉ cho guest
    title: 'Sign Up Dashboard',
  },
  {
    path: 'forbidden',
    component: ForbiddenComponent,
    title: 'Forbidden',
  },
  // error pages
  {
    path: '**',
    component: NotFoundComponent,
    title: 'NotFound Dashboard',
  },
];
