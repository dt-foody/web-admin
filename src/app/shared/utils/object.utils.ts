/**
 * Giữ lại các field hợp lệ trong một object
 */
export function pick<T extends object, K extends keyof T>(obj: any, keys: K[]): Pick<T, K> {
  const result = {} as Pick<T, K>;
  for (const key of keys) {
    if (obj && obj[key] !== undefined) {
      result[key] = obj[key];
    }
  }
  return result;
}

/**
 * Loại bỏ các field nhất định khỏi object
 */
export function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K> {
  const result = { ...obj };
  keys.forEach((key) => delete result[key]);
  return result;
}

/**
 * Deep clone an object (an toàn hơn JSON.parse)
 */
export function deepClone<T>(obj: T): T {
  return structuredClone ? structuredClone(obj) : JSON.parse(JSON.stringify(obj));
}
