/**
 * Prisma の UserItem（product 付き）を一覧 UI 用の薄い行型へ写す。
 * page と将来の API 応答整形で同じ形にするため一箇所に置く。
 */

import type { ItemsTableRow } from "@/lib/items/items-table-sort";

/** findMany include product の 1 件分に必要な最小形 */
export type UserItemWithProductForTable = {
  id: string;
  note: string | null;
  status1: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    jan: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
  };
};

export function toItemsTableRow(
  item: UserItemWithProductForTable,
): ItemsTableRow {
  return {
    id: item.id,
    note: item.note,
    status1: item.status1,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
    product: {
      jan: item.product.jan,
      name: item.product.name,
      brandName: item.product.brandName,
      imageUrl: item.product.imageUrl,
    },
  };
}
