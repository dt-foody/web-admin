import { Observable } from 'rxjs';

export type LogicalOperator = 'AND' | 'OR';

export type FieldType = 'text' | 'number' | 'date' | 'select' | 'boolean' | 'multi-select';

export enum Operator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  CONTAINS = 'CONTAINS',
  DOES_NOT_CONTAIN = 'DOES_NOT_CONTAIN',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  IS_EMPTY = 'IS_EMPTY',
  IS_NOT_EMPTY = 'IS_NOT_EMPTY',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  BETWEEN = 'BETWEEN',
  NOT_BETWEEN = 'NOT_BETWEEN',
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
}

export interface Condition {
  id: string;
  fieldId: string;
  operator: Operator;
  value: any;
}

export interface ConditionGroup {
  id: string;
  operator: LogicalOperator;
  conditions: (Condition | ConditionGroup)[];
}

export interface Field {
  id: string;
  group: string;
  name: string;
  type: FieldType;
  operators: Operator[];
  // For 'select' or 'multi-select' type
  source?: {
    valueField: string;
    labelField: string;
    optionsLoader: (params: {
      search?: string;
      page: number;
      limit: number;
    }) => Observable<PaginatedResponse<any>>;
  };
}

export interface PaginatedResponse<T> {
  results: T[];
  page: number;
  limit: number;
  totalPages: number;
  totalResults: number;
}
