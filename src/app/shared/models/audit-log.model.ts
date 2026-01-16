export interface AuditLogChange {
  field: string;
  oldValue: any;
  newValue: any;
}

export interface AuditLog {
  id: string;
  target: string;
  targetModel: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  performer: {
    id: string;
    name: string;
    email?: string;
    role?: string;
    avatar?: string;
  } | null;
  changes: AuditLogChange[];
  note?: string;
  createdAt: string;
  updatedAt: string;
}
