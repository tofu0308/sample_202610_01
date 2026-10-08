/**
 * 登録一覧テーブルの並べ替え（UI 非依存の純関数）。
 * status1 は候補の残量順（満タン→要補充）。未設定・未知値は末尾へ。
 */

import {
  isStatus1Option,
  STATUS1_OPTIONS,
  STATUS1_SORT_RANK,
} from "@/lib/items/constants";

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

/** 候補外の旧データは既知候補の後ろ（未設定よりは前） */
const STATUS1_UNKNOWN_RANK = STATUS1_OPTIONS.length;

function status1Rank(value: string): number {
  if (isStatus1Option(value)) {
    return STATUS1_SORT_RANK[value];
  }
  return STATUS1_UNKNOWN_RANK;
}

function compareStatus1(
  a: string | null,
  b: string | null,
  dir: ItemsTableSortDir,
): number {
  // 昇降どちらでも未設定は末尾（「残少を先に見たい」用途向け）
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const cmp = status1Rank(a) - status1Rank(b);
  return dir === "asc" ? cmp : -cmp;
}

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
      return compareStatus1(left.status1, right.status1, dir);
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
