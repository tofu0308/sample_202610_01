import { describe, expect, it } from "vitest";
import {
  sortItemsTableRows,
  type ItemsTableRow,
} from "@/lib/items/items-table-sort";

function row(
  partial: Pick<ItemsTableRow, "id" | "status1" | "createdAt"> & {
    name?: string;
    jan?: string;
  },
): ItemsTableRow {
  return {
    id: partial.id,
    note: null,
    status1: partial.status1,
    createdAt: partial.createdAt,
    product: {
      jan: partial.jan ?? "000",
      name: partial.name ?? "商品",
      brandName: null,
      imageUrl: null,
    },
  };
}

describe("sortItemsTableRows", () => {
  it("status1 の未設定は末尾に寄せる", () => {
    const rows = [
      row({ id: "1", status1: null, createdAt: "2026-01-01" }),
      row({ id: "2", status1: "残少", createdAt: "2026-01-02" }),
      row({ id: "3", status1: "十分", createdAt: "2026-01-03" }),
    ];

    const sorted = sortItemsTableRows(rows, "status1", "asc");
    expect(sorted.map((r) => r.id)).toEqual(["2", "3", "1"]);
  });

  it("同じキーを desc にすると順序が反転する（null は末尾のまま）", () => {
    const rows = [
      row({ id: "1", status1: "十分", createdAt: "2026-01-01" }),
      row({ id: "2", status1: "残少", createdAt: "2026-01-02" }),
      row({ id: "3", status1: null, createdAt: "2026-01-03" }),
    ];

    const sorted = sortItemsTableRows(rows, "status1", "desc");
    expect(sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });
});
