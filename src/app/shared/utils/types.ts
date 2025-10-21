export interface SortState {
  key: string; // trường cần sắp xếp (vd: 'name', 'createdAt')
  asc: boolean; // true = tăng, false = giảm
}

export interface ListQueryState {
  search?: string;
  page: number;
  pageSize: number;
  sort?: SortState;
  filters?: Record<string, any>;
}
