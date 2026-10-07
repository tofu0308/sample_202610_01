/** 連続スキャンのリスト行 ID（ブラウザ / テスト両対応） */
export function createEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}
