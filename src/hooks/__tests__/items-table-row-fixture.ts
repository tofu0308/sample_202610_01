/**
 * hooks テスト用の ItemsTableRow 組み立て。
 * 本番コードには置かない（テスト専用）。
 */

import type { ItemsTableRow } from "@/lib/items/items-table-sort";

export function itemsTableRow(
  partial: Pick<ItemsTableRow, "id"> & {
    name?: string;
    note?: string | null;
    jan?: string;
    status1?: string | null;
  },
): ItemsTableRow {
  return {
    id: partial.id,
    note: partial.note ?? null,
    status1: partial.status1 ?? null,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    product: {
      jan: partial.jan ?? "4900000000000",
      name: partial.name ?? "商品",
      brandName: null,
      imageUrl: null,
    },
  };
}
