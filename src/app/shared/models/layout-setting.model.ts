export interface HeaderNavItem {
  id: string;
  title: string;
  description: string;
  enable?: boolean;
}

export interface LayoutSetting {
  id: string;
  headerNavItems: HeaderNavItem[];
  createdAt?: string;
  updatedAt?: string;
}
