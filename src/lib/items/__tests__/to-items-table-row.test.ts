/**
 * 一覧 DTO マッピングの UT。
 */

import { describe, expect, it } from "vitest";
import { toItemsTableRow } from "@/lib/items/to-items-table-row";

describe("toItemsTableRow", () => {
  it("Date を ISO 文字列にし product を薄く写す", () => {
    const createdAt = new Date("2026-10-15T00:00:00.000Z");
    const updatedAt = new Date("2026-10-15T12:00:00.000Z");

    const row = toItemsTableRow({
      id: "item-1",
      note: "メモ",
      status1: "残少",
      createdAt,
      updatedAt,
      product: {
        jan: "4901234567890",
        name: "塗料A",
        brandName: "Brand",
        imageUrl: "https://example.com/a.jpg",
      },
    });

    expect(row).toEqual({
      id: "item-1",
      note: "メモ",
      status1: "残少",
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
      product: {
        jan: "4901234567890",
        name: "塗料A",
        brandName: "Brand",
        imageUrl: "https://example.com/a.jpg",
      },
    });
  });

  it("null フィールドもそのまま残す", () => {
    const row = toItemsTableRow({
      id: "item-2",
      note: null,
      status1: null,
      createdAt: new Date("2026-01-01T00:00:00.000Z"),
      updatedAt: new Date("2026-01-01T00:00:00.000Z"),
      product: {
        jan: "4901234567890",
        name: "名前のみ",
        brandName: null,
        imageUrl: null,
      },
    });

    expect(row.note).toBeNull();
    expect(row.status1).toBeNull();
    expect(row.product.brandName).toBeNull();
    expect(row.product.imageUrl).toBeNull();
  });
});
