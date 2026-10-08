import { describe, expect, it } from "vitest";
import { filterItemsTableRows } from "@/lib/items/filter-items-table";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

function row(
  partial: Pick<ItemsTableRow, "id"> & {
    name?: string;
    note?: string | null;
    jan?: string;
  },
): ItemsTableRow {
  return {
    id: partial.id,
    note: partial.note ?? null,
    status1: null,
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

const nameOnly = { includeNote: false, includeJan: false };

describe("filterItemsTableRows", () => {
  const rows = [
    row({ id: "1", name: "アクリル塗料 赤", note: "棚A", jan: "4901111111111" }),
    row({ id: "2", name: "エナメル 青", note: "予備の赤", jan: "4902222222222" }),
    row({ id: "3", name: "クリアー", note: null, jan: "4903333333333" }),
  ];

  it("空文字なら全件返す", () => {
    expect(filterItemsTableRows(rows, "  ", nameOnly).map((r) => r.id)).toEqual([
      "1",
      "2",
      "3",
    ]);
  });

  it("既定は商品名のみ", () => {
    expect(filterItemsTableRows(rows, "赤", nameOnly).map((r) => r.id)).toEqual([
      "1",
    ]);
  });

  it("メモを含めると note でも当たる", () => {
    expect(
      filterItemsTableRows(rows, "赤", {
        includeNote: true,
        includeJan: false,
      }).map((r) => r.id),
    ).toEqual(["1", "2"]);
  });

  it("JAN を含めると jan でも当たる", () => {
    expect(
      filterItemsTableRows(rows, "490222", {
        includeNote: false,
        includeJan: true,
      }).map((r) => r.id),
    ).toEqual(["2"]);
  });

  it("両方オンならメモと JAN のどちらでも当たる", () => {
    expect(
      filterItemsTableRows(rows, "棚A", {
        includeNote: true,
        includeJan: true,
      }).map((r) => r.id),
    ).toEqual(["1"]);
    expect(
      filterItemsTableRows(rows, "490333", {
        includeNote: true,
        includeJan: true,
      }).map((r) => r.id),
    ).toEqual(["3"]);
  });
});
