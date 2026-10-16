import { describe, expect, it } from "vitest";
import {
  sortItemsTableRows,
  type ItemsTableRow,
} from "@/lib/items/items-table-sort";

function row(
  partial: Pick<ItemsTableRow, "id" | "status1" | "createdAt"> & {
    name?: string;
    jan?: string;
    updatedAt?: string;
  },
): ItemsTableRow {
  return {
    id: partial.id,
    note: null,
    status1: partial.status1,
    createdAt: partial.createdAt,
    updatedAt: partial.updatedAt ?? partial.createdAt,
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

  it("未知の status1 は既知候補の後ろ・未設定より前。両方 null は同順", () => {
    const rows = [
      row({ id: "u", status1: "旧データ", createdAt: "2026-01-01" }),
      row({ id: "n", status1: null, createdAt: "2026-01-02" }),
      row({ id: "k", status1: "満タン", createdAt: "2026-01-03" }),
      row({ id: "n2", status1: null, createdAt: "2026-01-04" }),
    ];
    expect(sortItemsTableRows(rows, "status1", "asc").map((r) => r.id)).toEqual(
      ["k", "u", "n", "n2"],
    );
  });

  it("name / jan の昇降と createdAt / updatedAt", () => {
    const rows = [
      row({
        id: "a",
        status1: null,
        name: "ベ",
        jan: "4902222222222",
        createdAt: "2026-01-02T00:00:00.000Z",
        updatedAt: "2026-01-04T00:00:00.000Z",
      }),
      row({
        id: "b",
        status1: null,
        name: "ア",
        jan: "4901111111111",
        createdAt: "2026-01-01T00:00:00.000Z",
        updatedAt: "2026-01-05T00:00:00.000Z",
      }),
    ];

    expect(sortItemsTableRows(rows, "name", "asc").map((r) => r.id)).toEqual([
      "b",
      "a",
    ]);
    expect(sortItemsTableRows(rows, "name", "desc").map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
    expect(sortItemsTableRows(rows, "jan", "asc").map((r) => r.id)).toEqual([
      "b",
      "a",
    ]);
    expect(sortItemsTableRows(rows, "jan", "desc").map((r) => r.id)).toEqual([
      "a",
      "b",
    ]);
    expect(
      sortItemsTableRows(rows, "createdAt", "asc").map((r) => r.id),
    ).toEqual(["b", "a"]);
    expect(
      sortItemsTableRows(rows, "createdAt", "desc").map((r) => r.id),
    ).toEqual(["a", "b"]);
    expect(
      sortItemsTableRows(rows, "updatedAt", "asc").map((r) => r.id),
    ).toEqual(["a", "b"]);
    expect(
      sortItemsTableRows(rows, "updatedAt", "desc").map((r) => r.id),
    ).toEqual(["b", "a"]);
  });
});
