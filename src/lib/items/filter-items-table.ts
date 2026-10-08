/**
 * 登録一覧のフリーワード絞り込み（UI 非依存）。
 * 商品名は常に対象。メモ・JAN はチェックで足す（両方オン＝すべて）。
 */

import type { ItemsTableRow } from "@/lib/items/items-table-sort";

export type ItemsSearchOptions = {
  includeNote: boolean;
  includeJan: boolean;
};

function normalizeForSearch(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

function includesQuery(haystack: string | null | undefined, needle: string): boolean {
  if (!haystack) {
    return false;
  }
  return normalizeForSearch(haystack).includes(needle);
}

export function filterItemsTableRows(
  rows: ItemsTableRow[],
  query: string,
  options: ItemsSearchOptions,
): ItemsTableRow[] {
  const trimmed = query.trim();
  if (trimmed === "") {
    return rows;
  }

  const needle = normalizeForSearch(trimmed);

  return rows.filter((row) => {
    if (includesQuery(row.product.name, needle)) {
      return true;
    }
    if (options.includeNote && includesQuery(row.note, needle)) {
      return true;
    }
    if (options.includeJan && includesQuery(row.product.jan, needle)) {
      return true;
    }
    return false;
  });
}
