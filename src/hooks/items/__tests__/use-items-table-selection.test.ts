/** @vitest-environment jsdom */
/**
 * 選択 Set と一括残量／削除の分岐。
 * fetch は lib を mock し、本番へ DI しない。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { itemsTableRow } from "@/hooks/__tests__/items-table-row-fixture";
import { useItemsTableSelection } from "@/hooks/items/use-items-table-selection";

const refresh = vi.fn();
const patchItemsBulk = vi.fn();
const deleteItemsBulk = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/items/item-bulk-request", () => ({
  patchItemsBulk: (...args: unknown[]) => patchItemsBulk(...args),
  deleteItemsBulk: (...args: unknown[]) => deleteItemsBulk(...args),
}));

const items = [
  itemsTableRow({ id: "a", name: "A" }),
  itemsTableRow({ id: "b", name: "B" }),
  itemsTableRow({ id: "c", name: "C" }),
];

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
      items: typeof items;
      sorted: typeof items;
      setError: (message: string | null) => void;
      onBeforeBulk: () => void;
    }>,
  ) {
    const setError = overrides?.setError ?? vi.fn();
    const onBeforeBulk = overrides?.onBeforeBulk ?? vi.fn();
    const hook = renderHook(
      (props: {
        items: typeof items;
        sorted: typeof items;
      }) =>
        useItemsTableSelection({
          items: props.items,
          sorted: props.sorted,
          setError,
          onBeforeBulk,
        }),
      {
        initialProps: {
          items: overrides?.items ?? items,
          sorted: overrides?.sorted ?? items,
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
    const sorted = [items[0], items[1]];
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
      items: [items[1], items[2]],
      sorted: [items[1], items[2]],
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
    // 失敗時は選択を残す
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
