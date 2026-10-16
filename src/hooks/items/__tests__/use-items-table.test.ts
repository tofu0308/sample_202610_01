/** @vitest-environment jsdom */
/**
 * 一覧組み立て hook。子 hook の接続（error 共有・削除後の deselect）を確認する。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { itemsTableRow } from "@/hooks/__tests__/items-table-row-fixture";
import { useItemsTable } from "@/hooks/items/use-items-table";

const refresh = vi.fn();
const deleteItem = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/items/item-mutation-request", () => ({
  patchItem: vi.fn(),
  deleteItem: (...args: unknown[]) => deleteItem(...args),
}));

vi.mock("@/lib/items/item-bulk-request", () => ({
  patchItemsBulk: vi.fn(),
  deleteItemsBulk: vi.fn(),
}));

const items = [
  itemsTableRow({ id: "a", name: "A" }),
  itemsTableRow({ id: "b", name: "B" }),
];

describe("useItemsTable", () => {
  beforeEach(() => {
    refresh.mockReset();
    deleteItem.mockReset();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  it("検索と選択を束ね、削除成功で選択から外す", async () => {
    const { result } = renderHook(() => useItemsTable(items));

    act(() => {
      result.current.toggleSelect("a");
      result.current.setSearchQuery("A");
    });
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.matchCount).toBe(1);

    deleteItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.removeItem(items[0]);
    });
    expect(result.current.selectedCount).toBe(0);
    expect(refresh).toHaveBeenCalled();
  });
});
