export interface EmployeeEmail {
  type?: 'Home' | 'Company' | 'Other';
  value: string;
}

export interface EmployeePhone {
  type?: 'Home' | 'Company' | 'Other';
  value: string;
}

export interface EmployeeAddress {
  label?: string;
  recipientName: string;
  recipientPhone: string;
  street: string;
  ward: string;
  district: string;
  city: string;
  fullAddress?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [lng, lat]
  };
  isDefault?: boolean;
}

export interface Employee {
  id: string;
  employeeId?: number;
  user?: string | any; // Có thể là ID hoặc Object User đã populate

  name: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string | Date;

  emails?: EmployeeEmail[];
  phones?: EmployeePhone[];
  addresses?: EmployeeAddress[];

  // Metadata & Logs
  lastOrderDate?: string | Date;
  createdBy?: string;
  isDeleted?: boolean;
  deletedAt?: string | Date;
  deletedBy?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

// [CẬP NHẬT QUAN TRỌNG] Cấu trúc Form Data mới
export interface EmployeeFormData {
  // --- THÔNG TIN EMPLOYEE ---
  name: string;
  gender?: 'male' | 'female' | 'other';
  birthDate?: string | Date;

  emails: EmployeeEmail[];
  phones: EmployeePhone[];
  addresses: EmployeeAddress[];

  // --- THÔNG TIN USER (NESTED) ---
  user?: {
    email: string;
    password?: string; // Optional khi edit
    role: string; // System Role (staff/admin)
    roles: string[]; // Custom Roles IDs
    isActive: boolean;
    isEmailVerified: boolean;

    extraPermissions: string[];
    excludePermissions: string[];
  };
}
