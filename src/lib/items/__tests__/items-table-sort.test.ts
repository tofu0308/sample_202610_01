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
  it("status1 は残量順（満タン→要補充）、未設定は末尾", () => {
    const rows = [
      row({ id: "1", status1: null, createdAt: "2026-01-01" }),
      row({ id: "2", status1: "残少", createdAt: "2026-01-02" }),
      row({ id: "3", status1: "満タン", createdAt: "2026-01-03" }),
      row({ id: "4", status1: "要補充", createdAt: "2026-01-04" }),
      row({ id: "5", status1: "半分", createdAt: "2026-01-05" }),
    ];

    const sorted = sortItemsTableRows(rows, "status1", "asc");
    expect(sorted.map((r) => r.id)).toEqual(["3", "5", "2", "4", "1"]);
  });

  it("status1 desc は残少側が先、未設定は末尾のまま", () => {
    const rows = [
      row({ id: "1", status1: "満タン", createdAt: "2026-01-01" }),
      row({ id: "2", status1: "残少", createdAt: "2026-01-02" }),
      row({ id: "3", status1: null, createdAt: "2026-01-03" }),
    ];

    const sorted = sortItemsTableRows(rows, "status1", "desc");
    expect(sorted.map((r) => r.id)).toEqual(["2", "1", "3"]);
  });
});
