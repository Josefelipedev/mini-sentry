export function filterSensitiveFields(
  obj: Record<string, unknown> | undefined,
  denyList: string[]
): Record<string, unknown> | undefined {
  if (!obj || typeof obj !== 'object') return obj;

  const lower = denyList.map((k) => k.toLowerCase());
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (lower.some((denied) => key.toLowerCase().includes(denied))) {
      result[key] = '[Filtered]';
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      result[key] = filterSensitiveFields(value as Record<string, unknown>, denyList);
    } else {
      result[key] = value;
    }
  }

  return result;
}
