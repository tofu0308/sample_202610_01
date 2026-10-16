/** @vitest-environment happy-dom */
/**
 * items 系 hooks を 1 ファイルにまとめ、DOM 環境の起動回数を減らす。
 * request / router は mock（本番へ DI しない）。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { itemsTableRow } from "@/hooks/__tests__/items-table-row-fixture";
import { useFindRegisteredItem } from "@/hooks/items/use-find-registered-item";
import { useItemsTable } from "@/hooks/items/use-items-table";
import { useItemsTableEditing } from "@/hooks/items/use-items-table-editing";
import { useItemsTableQuery } from "@/hooks/items/use-items-table-query";
import { useItemsTableSelection } from "@/hooks/items/use-items-table-selection";
import {
  useRegisterItem,
  useRegisterItems,
} from "@/hooks/items/use-register-item";
import type { ItemLimitView } from "@/lib/items/item-limit-view";

const refresh = vi.fn();
const patchItemsBulk = vi.fn();
const deleteItemsBulk = vi.fn();
const patchItem = vi.fn();
const deleteItem = vi.fn();
const postRegisterItem = vi.fn();
const postRegisterItemsBulk = vi.fn();
const fetchProductLookup = vi.fn();
const scrollToElementIdMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/items/item-bulk-request", () => ({
  patchItemsBulk: (...args: unknown[]) => patchItemsBulk(...args),
  deleteItemsBulk: (...args: unknown[]) => deleteItemsBulk(...args),
}));

vi.mock("@/lib/items/item-mutation-request", () => ({
  patchItem: (...args: unknown[]) => patchItem(...args),
  deleteItem: (...args: unknown[]) => deleteItem(...args),
}));

vi.mock("@/lib/items/register-item-request", () => ({
  postRegisterItem: (...args: unknown[]) => postRegisterItem(...args),
  postRegisterItemsBulk: (...args: unknown[]) => postRegisterItemsBulk(...args),
}));

vi.mock("@/lib/products/product-lookup-request", () => ({
  fetchProductLookup: (...args: unknown[]) => fetchProductLookup(...args),
}));

vi.mock("@/lib/scan/scroll-to-element-id", () => ({
  scrollToElementId: (...args: unknown[]) => scrollToElementIdMock(...args),
}));

const queryRows = [
  itemsTableRow({
    id: "1",
    name: "アクリル 赤",
    note: "棚A",
    jan: "4901111111111",
    status1: "残少",
  }),
  itemsTableRow({
    id: "2",
    name: "エナメル 青",
    note: "予備の赤",
    jan: "4902222222222",
    status1: "満タン",
  }),
  itemsTableRow({
    id: "3",
    name: "クリアー",
    note: null,
    jan: "4903333333333",
    status1: null,
  }),
];

const selectionItems = [
  itemsTableRow({ id: "a", name: "A" }),
  itemsTableRow({ id: "b", name: "B" }),
  itemsTableRow({ id: "c", name: "C" }),
];

const editItem = itemsTableRow({
  id: "row-1",
  name: "アクリル",
  status1: "半分",
  note: "棚A",
});

const registerProduct = {
  found: true as const,
  code: "4901234567890",
  name: "塗料",
  source: "yahoo_shopping" as const,
};

describe("useItemsTableQuery", () => {
  it("既定は status1 昇順で、未設定は後ろ", () => {
    const { result } = renderHook(() => useItemsTableQuery(queryRows));

    expect(result.current.sortKey).toBe("status1");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["2", "1", "3"]);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.matchCount).toBe(3);
  });

  it("同じキーの handleSort で昇降をトグルする", () => {
    const { result } = renderHook(() => useItemsTableQuery(queryRows));

    act(() => {
      result.current.handleSort("status1");
    });
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);

    act(() => {
      result.current.handleSort("status1");
    });
    expect(result.current.sortDir).toBe("asc");
  });

  it("別キーへ切り替えると昇順から始める", () => {
    const { result } = renderHook(() => useItemsTableQuery(queryRows));

    act(() => {
      result.current.handleSort("status1");
    });
    expect(result.current.sortDir).toBe("desc");

    act(() => {
      result.current.handleSort("name");
    });
    expect(result.current.sortKey).toBe("name");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("clearFreewordSearch でクエリと対象フラグを戻す", () => {
    const { result } = renderHook(() => useItemsTableQuery(queryRows));

    act(() => {
      result.current.setSearchQuery("赤");
      result.current.setSearchIncludeNote(true);
      result.current.setSearchIncludeJan(true);
    });
    act(() => {
      result.current.clearFreewordSearch();
    });
    expect(result.current.searchQuery).toBe("");
    expect(result.current.searchIncludeNote).toBe(false);
    expect(result.current.searchIncludeJan).toBe(false);
    expect(result.current.matchCount).toBe(3);
  });

  it("検索は名前のみが既定。note / jan フラグで対象が増える", () => {
    const { result } = renderHook(() => useItemsTableQuery(queryRows));

    act(() => {
      result.current.setSearchQuery("赤");
    });
    expect(result.current.matchCount).toBe(1);
    expect(result.current.sorted.map((r) => r.id)).toEqual(["1"]);

    act(() => {
      result.current.setSearchIncludeNote(true);
    });
    expect(result.current.matchCount).toBe(2);
    expect(result.current.sorted.map((r) => r.id).sort()).toEqual(["1", "2"]);

    act(() => {
      result.current.setSearchQuery("490333");
      result.current.setSearchIncludeNote(false);
      result.current.setSearchIncludeJan(true);
    });
    expect(result.current.matchCount).toBe(1);
    expect(result.current.sorted.map((r) => r.id)).toEqual(["3"]);
  });
});

describe("useItemsTableSelection", () => {
  beforeEach(() => {
    refresh.mockReset();
    patchItemsBulk.mockReset();
    deleteItemsBulk.mockReset();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  function renderSelection(
    overrides?: Partial<{
      items: typeof selectionItems;
      sorted: typeof selectionItems;
      setError: (message: string | null) => void;
      onBeforeBulk: () => void;
    }>,
  ) {
    const setError = overrides?.setError ?? vi.fn();
    const onBeforeBulk = overrides?.onBeforeBulk ?? vi.fn();
    const hook = renderHook(
      (props: {
        items: typeof selectionItems;
        sorted: typeof selectionItems;
      }) =>
        useItemsTableSelection({
          items: props.items,
          sorted: props.sorted,
          setError,
          onBeforeBulk,
        }),
      {
        initialProps: {
          items: overrides?.items ?? selectionItems,
          sorted: overrides?.sorted ?? selectionItems,
        },
      },
    );
    return { ...hook, setError, onBeforeBulk };
  }

  it("toggleSelect で選択／解除する", () => {
    const { result } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
    });
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedIds.has("a")).toBe(true);

    act(() => {
      result.current.toggleSelect("a");
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it("表示中の全選択／全解除と clearSelection", () => {
    const sorted = [selectionItems[0], selectionItems[1]];
    const { result } = renderSelection({ sorted });

    act(() => {
      result.current.toggleSelectAllVisible();
    });
    expect(result.current.allVisibleSelected).toBe(true);
    expect(result.current.selectedCount).toBe(2);

    act(() => {
      result.current.toggleSelectAllVisible();
    });
    expect(result.current.selectedCount).toBe(0);

    act(() => {
      result.current.toggleSelect("a");
      result.current.toggleSelect("c");
      result.current.clearSelection();
    });
    expect(result.current.selectedCount).toBe(0);
  });

  it("items から消えた id は selectedCount に含めない", () => {
    const { result, rerender } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
      result.current.toggleSelect("b");
    });
    expect(result.current.selectedCount).toBe(2);

    rerender({
      items: [selectionItems[1], selectionItems[2]],
      sorted: [selectionItems[1], selectionItems[2]],
    });
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedIds.has("a")).toBe(true);
  });

  it("選択0件なら一括更新しない", async () => {
    const { result, onBeforeBulk } = renderSelection();

    await act(async () => {
      await result.current.applyBulkStatus1();
    });

    expect(patchItemsBulk).not.toHaveBeenCalled();
    expect(onBeforeBulk).not.toHaveBeenCalled();
  });

  it("一括残量: 成功時は選択クリアと refresh。onBeforeBulk を呼ぶ", async () => {
    const { result, setError, onBeforeBulk } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
      result.current.setBulkStatus1("半分");
    });

    patchItemsBulk.mockResolvedValue({
      ok: true,
      requested: 1,
      affected: 1,
      skipped: 0,
    });

    await act(async () => {
      await result.current.applyBulkStatus1();
    });

    expect(onBeforeBulk).toHaveBeenCalledTimes(1);
    expect(patchItemsBulk).toHaveBeenCalledWith(["a"], "半分");
    expect(result.current.selectedCount).toBe(0);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(setError).toHaveBeenCalledWith(null);
  });

  it("一括残量: skipped があればメッセージを残し、失敗時は error", async () => {
    const { result, setError } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
      result.current.setBulkStatus1("半分");
    });

    patchItemsBulk.mockResolvedValue({
      ok: true,
      requested: 1,
      affected: 0,
      skipped: 1,
    });

    await act(async () => {
      await result.current.applyBulkStatus1();
    });
    expect(setError).toHaveBeenCalledWith(
      "残量の一括更新で対象外の行がありました（1 件）",
    );
    expect(refresh).not.toHaveBeenCalled();

    act(() => {
      result.current.toggleSelect("b");
    });
    patchItemsBulk.mockResolvedValue({ ok: false, message: "権限がありません" });

    await act(async () => {
      await result.current.applyBulkStatus1();
    });
    expect(setError).toHaveBeenCalledWith("権限がありません");
  });

  it("一括残量: throw 時はエラーメッセージと選択クリア", async () => {
    const { result, setError } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
      result.current.setBulkStatus1("半分");
    });
    patchItemsBulk.mockRejectedValue(new Error("boom"));

    await act(async () => {
      await result.current.applyBulkStatus1();
    });

    expect(setError).toHaveBeenCalledWith("一括更新でエラーが発生しました");
    expect(result.current.selectedCount).toBe(0);
  });

  it("一括削除: confirm キャンセルなら呼ばない", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );
    const { result } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
    });

    await act(async () => {
      await result.current.removeSelected();
    });

    expect(deleteItemsBulk).not.toHaveBeenCalled();
  });

  it("一括削除: 成功時はクリアと refresh", async () => {
    const { result, onBeforeBulk } = renderSelection();

    act(() => {
      result.current.toggleSelect("a");
      result.current.toggleSelect("b");
    });

    deleteItemsBulk.mockResolvedValue({
      ok: true,
      requested: 2,
      affected: 2,
      skipped: 0,
    });

    await act(async () => {
      await result.current.removeSelected();
    });
    expect(onBeforeBulk).toHaveBeenCalled();
    expect(result.current.selectedCount).toBe(0);
    expect(refresh).toHaveBeenCalledTimes(1);
  });

  it("一括削除: 失敗・skipped・throw でメッセージを分ける", async () => {
    const { result, setError } = renderSelection();

    act(() => {
      result.current.toggleSelect("c");
    });
    deleteItemsBulk.mockResolvedValue({ ok: false, message: "削除失敗" });
    await act(async () => {
      await result.current.removeSelected();
    });
    expect(setError).toHaveBeenCalledWith("削除失敗");
    expect(result.current.selectedCount).toBe(1);

    deleteItemsBulk.mockResolvedValue({
      ok: true,
      requested: 1,
      affected: 0,
      skipped: 1,
    });
    await act(async () => {
      await result.current.removeSelected();
    });
    expect(setError).toHaveBeenCalledWith(
      "削除できなかった行があります（1 件）",
    );

    deleteItemsBulk.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.removeSelected();
    });
    expect(setError).toHaveBeenCalledWith("一括削除でエラーが発生しました");
  });
});

describe("useItemsTableEditing", () => {
  beforeEach(() => {
    refresh.mockReset();
    patchItem.mockReset();
    deleteItem.mockReset();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  function renderEditing(
    overrides?: Partial<{
      setError: (message: string | null) => void;
      onItemDeleted: (id: string) => void;
    }>,
  ) {
    const setError = overrides?.setError ?? vi.fn();
    const onItemDeleted = overrides?.onItemDeleted ?? vi.fn();
    const hook = renderHook(() =>
      useItemsTableEditing({ setError, onItemDeleted }),
    );
    return { ...hook, setError, onItemDeleted };
  }

  it("startEdit で draft を入れ、cancelEdit で戻す", () => {
    const { result, setError } = renderEditing();

    act(() => {
      result.current.startEdit(editItem);
    });
    expect(result.current.editingId).toBe("row-1");
    expect(result.current.draftStatus1).toBe("半分");
    expect(result.current.draftNote).toBe("棚A");
    expect(setError).toHaveBeenCalledWith(null);

    act(() => {
      result.current.setDraftStatus1("残少");
      result.current.setDraftNote("更新メモ");
      result.current.cancelEdit();
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.draftStatus1).toBe("");
    expect(result.current.draftNote).toBe("");
  });

  it("saveEdit: 成功で編集終了と refresh。失敗・throw はメッセージ", async () => {
    const { result, setError } = renderEditing();

    act(() => {
      result.current.startEdit(editItem);
      result.current.setDraftStatus1("要補充");
      result.current.setDraftNote("減った");
    });

    patchItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.saveEdit(editItem);
    });
    expect(patchItem).toHaveBeenCalledWith("row-1", {
      status1: "要補充",
      note: "減った",
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.pendingId).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.startEdit(editItem);
    });
    patchItem.mockResolvedValue({ ok: false, message: "更新できません" });
    await act(async () => {
      await result.current.saveEdit(editItem);
    });
    expect(setError).toHaveBeenCalledWith("更新できません");
    expect(result.current.editingId).toBe("row-1");
    expect(refresh).toHaveBeenCalledTimes(1);

    patchItem.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.saveEdit(editItem);
    });
    expect(setError).toHaveBeenCalledWith("更新処理でエラーが発生しました");
    expect(result.current.pendingId).toBeNull();
  });

  it("removeItem: confirm キャンセルなら削除しない", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );
    const { result, onItemDeleted } = renderEditing();

    await act(async () => {
      await result.current.removeItem(editItem);
    });

    expect(deleteItem).not.toHaveBeenCalled();
    expect(onItemDeleted).not.toHaveBeenCalled();
  });

  it("removeItem: 成功時は onItemDeleted と refresh。編集中ならキャンセル", async () => {
    const { result, onItemDeleted, setError } = renderEditing();

    act(() => {
      result.current.startEdit(editItem);
    });

    deleteItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.removeItem(editItem);
    });

    expect(deleteItem).toHaveBeenCalledWith("row-1");
    expect(onItemDeleted).toHaveBeenCalledWith("row-1");
    expect(result.current.editingId).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.pendingId).toBeNull();

    deleteItem.mockResolvedValue({ ok: false, message: "削除失敗" });
    await act(async () => {
      await result.current.removeItem(editItem);
    });
    expect(setError).toHaveBeenCalledWith("削除失敗");

    deleteItem.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.removeItem(editItem);
    });
    expect(setError).toHaveBeenCalledWith("削除処理でエラーが発生しました");
  });
});

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
    const tableItems = [
      itemsTableRow({ id: "a", name: "A" }),
      itemsTableRow({ id: "b", name: "B" }),
    ];
    const { result } = renderHook(() => useItemsTable(tableItems));

    act(() => {
      result.current.toggleSelect("a");
      result.current.setSearchQuery("A");
    });
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.matchCount).toBe(1);

    deleteItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.removeItem(tableItems[0]);
    });
    expect(result.current.selectedCount).toBe(0);
    expect(refresh).toHaveBeenCalled();
  });
});

describe("useRegisterItem", () => {
  beforeEach(() => {
    refresh.mockReset();
    postRegisterItem.mockReset();
  });

  it("成功時は onRegistered があれば refresh しない", async () => {
    const onRegistered = vi.fn();
    const { result } = renderHook(() => useRegisterItem({ onRegistered }));
    postRegisterItem.mockResolvedValue({ ok: true });

    await act(async () => {
      await result.current.register(registerProduct);
    });
    expect(result.current.successMessage).toBe("登録しました");
    expect(onRegistered).toHaveBeenCalledOnce();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("失敗・throw は error。onRegistered 無しなら refresh", async () => {
    const { result } = renderHook(() => useRegisterItem());
    postRegisterItem.mockResolvedValue({ ok: false, message: "登録済み" });
    await act(async () => {
      await result.current.register(registerProduct);
    });
    expect(result.current.error).toBe("登録済み");

    postRegisterItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.register(registerProduct);
    });
    expect(refresh).toHaveBeenCalled();

    postRegisterItem.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.register(registerProduct);
    });
    expect(result.current.error).toBe("登録処理でエラーが発生しました");
  });
});

describe("useRegisterItems", () => {
  beforeEach(() => {
    refresh.mockReset();
    postRegisterItemsBulk.mockReset();
  });

  it("0 件は何もしない", async () => {
    const { result } = renderHook(() => useRegisterItems());
    await act(async () => {
      await result.current.registerMany([]);
    });
    expect(postRegisterItemsBulk).not.toHaveBeenCalled();
  });

  it("作成ありは onRegistered、失敗件数は error", async () => {
    const onRegistered = vi.fn();
    const { result } = renderHook(() => useRegisterItems({ onRegistered }));
    postRegisterItemsBulk.mockResolvedValue({
      ok: true,
      created: 1,
      duplicates: 1,
      failed: 1,
      requested: 3,
    });

    await act(async () => {
      await result.current.registerMany([registerProduct, registerProduct]);
    });
    expect(result.current.successMessage).toContain("1 件登録");
    expect(result.current.error).toBe("一部の登録に失敗しました");
    expect(onRegistered).toHaveBeenCalledOnce();
  });

  it("作成0・重複のみなら refresh。全滅は error", async () => {
    const { result } = renderHook(() => useRegisterItems());
    postRegisterItemsBulk.mockResolvedValue({
      ok: true,
      created: 0,
      duplicates: 2,
      failed: 0,
      requested: 2,
    });
    await act(async () => {
      await result.current.registerMany([registerProduct]);
    });
    expect(refresh).toHaveBeenCalled();

    postRegisterItemsBulk.mockResolvedValue({
      ok: true,
      created: 0,
      duplicates: 0,
      failed: 0,
      requested: 1,
    });
    await act(async () => {
      await result.current.registerMany([registerProduct]);
    });
    expect(result.current.error).toBe("登録できる商品がありませんでした");
  });
});

describe("useFindRegisteredItem", () => {
  const findItems = [{ id: "owned", jan: "4901111111111" }];
  const itemLimit: ItemLimitView = {
    currentCount: 1,
    limit: 100,
    unlimited: false,
    ownedJans: ["4901111111111"],
  };

  beforeEach(() => {
    refresh.mockReset();
    fetchProductLookup.mockReset();
    postRegisterItem.mockReset();
    scrollToElementIdMock.mockReset();
    vi.stubGlobal(
      "confirm",
      vi.fn(() => true),
    );
  });

  it("所持済み JAN ならハイライトし照会しない", async () => {
    const onClearFreeword = vi.fn();
    const { result } = renderHook(() =>
      useFindRegisteredItem({
        items: findItems,
        itemLimit,
        onClearFreeword,
      }),
    );

    await act(async () => {
      await result.current.runFind("4901111111111");
    });

    expect(onClearFreeword).toHaveBeenCalled();
    expect(result.current.highlightId).toBe("owned");
    expect(scrollToElementIdMock).toHaveBeenCalledWith("item-row-owned");
    expect(fetchProductLookup).not.toHaveBeenCalled();
  });

  it("未所持なら照会→確認→登録→refresh", async () => {
    const onClearFreeword = vi.fn();
    fetchProductLookup.mockResolvedValue({
      data: {
        found: true,
        code: "4909999999999",
        name: "新規",
        source: "yahoo_shopping",
      },
      error: null,
    });
    postRegisterItem.mockResolvedValue({ ok: true });

    const { result, rerender } = renderHook(
      ({ items }) =>
        useFindRegisteredItem({
          items,
          itemLimit,
          onClearFreeword,
        }),
      { initialProps: { items: findItems } },
    );

    await act(async () => {
      await result.current.runFind("4909999999999");
    });

    expect(fetchProductLookup).toHaveBeenCalledWith("4909999999999");
    expect(postRegisterItem).toHaveBeenCalled();
    expect(refresh).toHaveBeenCalled();

    act(() => {
      rerender({
        items: [...findItems, { id: "new", jan: "4909999999999" }],
      });
    });

    expect(result.current.highlightId).toBe("new");
  });

  it("確認キャンセルなら登録しない", async () => {
    vi.stubGlobal(
      "confirm",
      vi.fn(() => false),
    );
    fetchProductLookup.mockResolvedValue({
      data: {
        found: true,
        code: "4909999999999",
        name: "新規",
        source: "yahoo_shopping",
      },
      error: null,
    });

    const { result } = renderHook(() =>
      useFindRegisteredItem({
        items: findItems,
        itemLimit,
        onClearFreeword: vi.fn(),
      }),
    );

    await act(async () => {
      await result.current.runFind("4909999999999");
    });

    expect(postRegisterItem).not.toHaveBeenCalled();
    expect(result.current.message).toContain("キャンセル");
  });
});
