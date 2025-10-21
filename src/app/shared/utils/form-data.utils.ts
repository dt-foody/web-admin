import { pick, deepClone } from './object.utils';

/**
 * Làm sạch dữ liệu form trước khi gửi về backend
 * (Chỉ giữ lại các field hợp lệ định nghĩa trong interface)
 */
export function sanitizeFormData<T extends object>(data: any, validKeys: (keyof T)[]): T {
  return pick<T, keyof T>(data, validKeys);
}

/**
 * Tạo form data mặc định (clone để không bị tham chiếu)
 */
export function createFormData<T extends object>(template: T): T {
  return deepClone(template);
}

/**
 * Reset form về giá trị mặc định
 */
export function resetFormData<T extends object>(form: T, defaultData: T): T {
  return deepClone(defaultData);
}

/**
 * Merge dữ liệu mới vào form hiện tại, chỉ override field hợp lệ
 */
export function mergeFormData<T extends object>(current: T, incoming: Partial<T>): T {
  const merged = { ...current };
  for (const key in incoming) {
    if (key in current && incoming[key] !== undefined) {
      merged[key] = incoming[key]!;
    }
  }
  return merged;
}

/**
 * Lọc dữ liệu dựa theo mẫu (template) — hỗ trợ đệ quy cho nested object / array
 */
export function deepSanitize<T extends object>(data: any, template: T): T {
  if (Array.isArray(template)) {
    // Nếu template là mảng → sanitize từng phần tử
    const itemTemplate = template[0];
    return (
      Array.isArray(data) ? data.map((item) => deepSanitize(item, itemTemplate as any)) : []
    ) as any;
  }

  if (typeof template === 'object' && template !== null) {
    const result: any = {};
    for (const key of Object.keys(template) as (keyof T)[]) {
      const value = data?.[key];

      if (typeof template[key] === 'object' && template[key] !== null) {
        result[key] = deepSanitize(value, template[key] as any);
      } else {
        result[key] = value;
      }
    }
    return result;
  }

  return data;
}
