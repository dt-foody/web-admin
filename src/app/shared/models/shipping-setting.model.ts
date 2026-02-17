export interface ShippingSetting {
  id: string;
  name: string;
  priority: number;
  fixedFee: number;
  conditions: any; // Using 'any' for now or ConditionGroup
  isActive: boolean;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type CreateShippingSettingDto = Omit<ShippingSetting, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateShippingSettingDto = Partial<CreateShippingSettingDto>;
