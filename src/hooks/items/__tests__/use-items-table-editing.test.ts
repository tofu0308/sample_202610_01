/** @vitest-environment jsdom */
/**
 * 単行編集・単件削除の分岐。
 * mutation は lib を mock し、本番へ DI しない。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { itemsTableRow } from "@/hooks/__tests__/items-table-row-fixture";
import { useItemsTableEditing } from "@/hooks/items/use-items-table-editing";

const refresh = vi.fn();
const patchItem = vi.fn();
const deleteItem = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/items/item-mutation-request", () => ({
  patchItem: (...args: unknown[]) => patchItem(...args),
  deleteItem: (...args: unknown[]) => deleteItem(...args),
}));

const item = itemsTableRow({
  id: "row-1",
  name: "アクリル",
  status1: "半分",
  note: "棚A",
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
      result.current.startEdit(item);
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
      result.current.startEdit(item);
      result.current.setDraftStatus1("要補充");
      result.current.setDraftNote("減った");
    });

    patchItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.saveEdit(item);
    });
    expect(patchItem).toHaveBeenCalledWith("row-1", {
      status1: "要補充",
      note: "減った",
    });
    expect(result.current.editingId).toBeNull();
    expect(result.current.pendingId).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.startEdit(item);
    });
    patchItem.mockResolvedValue({ ok: false, message: "更新できません" });
    await act(async () => {
      await result.current.saveEdit(item);
    });
    expect(setError).toHaveBeenCalledWith("更新できません");
    expect(result.current.editingId).toBe("row-1");
    expect(refresh).toHaveBeenCalledTimes(1);

    patchItem.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.saveEdit(item);
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
      await result.current.removeItem(item);
    });

    expect(deleteItem).not.toHaveBeenCalled();
    expect(onItemDeleted).not.toHaveBeenCalled();
  });

  it("removeItem: 成功時は onItemDeleted と refresh。編集中ならキャンセル", async () => {
    const { result, onItemDeleted, setError } = renderEditing();

    act(() => {
      result.current.startEdit(item);
    });

    deleteItem.mockResolvedValue({ ok: true });
    await act(async () => {
      await result.current.removeItem(item);
    });

    expect(deleteItem).toHaveBeenCalledWith("row-1");
    expect(onItemDeleted).toHaveBeenCalledWith("row-1");
    expect(result.current.editingId).toBeNull();
    expect(refresh).toHaveBeenCalledTimes(1);
    expect(result.current.pendingId).toBeNull();

    deleteItem.mockResolvedValue({ ok: false, message: "削除失敗" });
    await act(async () => {
      await result.current.removeItem(item);
    });
    expect(setError).toHaveBeenCalledWith("削除失敗");

    deleteItem.mockRejectedValue(new Error("boom"));
    await act(async () => {
      await result.current.removeItem(item);
    });
    expect(setError).toHaveBeenCalledWith("削除処理でエラーが発生しました");
  });
});
