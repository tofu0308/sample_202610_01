/**
 * 読取文字列を JAN 等の照会用数字列に揃える（API スキーマと同じルール）。
 */

/** 8〜14 桁の数字列。範囲外は null */
export function normalizeBarcodeDigits(raw: string): string | null {
  const digits = raw.trim().replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 14) {
    return null;
  }
  return digits;
}
