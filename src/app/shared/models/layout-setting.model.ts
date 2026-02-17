import { DealOptionConfig } from './deal-setting.model';

export interface HeaderNavItem {
  id: string;
  title: string;
  description: string;
  enable?: boolean;
}

export interface LayoutSetting {
  id: string;
  headerNavItems: HeaderNavItem[];
  flashSale?: DealOptionConfig;
  combo?: DealOptionConfig;
  createdAt?: string;
  updatedAt?: string;
}
