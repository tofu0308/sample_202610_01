/**
 * 登録一覧テーブルの並べ替え（UI 非依存の純関数）。
 * 未設定のステータス／名前は末尾に寄せて、入力済みを先に見やすくする。
 */

export type ItemsTableRow = {
  id: string;
  note: string | null;
  status1: string | null;
  createdAt: string;
  product: {
    jan: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
  };
};

export type ItemsTableSortKey = "status1" | "name" | "jan" | "createdAt";
export type ItemsTableSortDir = "asc" | "desc";

function compareNullableText(
  a: string | null,
  b: string | null,
  dir: ItemsTableSortDir,
): number {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const cmp = a.localeCompare(b, "ja");
  return dir === "asc" ? cmp : -cmp;
}

export function sortItemsTableRows(
  rows: ItemsTableRow[],
  key: ItemsTableSortKey,
  dir: ItemsTableSortDir,
): ItemsTableRow[] {
  const copy = [...rows];
  copy.sort((left, right) => {
    if (key === "status1") {
      return compareNullableText(left.status1, right.status1, dir);
    }
    if (key === "name") {
      return compareNullableText(left.product.name, right.product.name, dir);
    }
    if (key === "jan") {
      return compareNullableText(left.product.jan, right.product.jan, dir);
    }
    const cmp = left.createdAt.localeCompare(right.createdAt);
    return dir === "asc" ? cmp : -cmp;
  });
  return copy;
}
