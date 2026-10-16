/**
 * 所持一覧から JAN で 1 件探す（スキャン検索用のクライアント照合）。
 */

export type FindableItem = {
  id: string;
  jan: string;
};

/** 正規化済み JAN と完全一致する行。無ければ null */
export function findRegisteredItemByJan(
  items: readonly FindableItem[],
  normalizedJan: string,
): FindableItem | null {
  const found = items.find((item) => item.jan === normalizedJan);
  return found ?? null;
}
