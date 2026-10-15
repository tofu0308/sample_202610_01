/**
 * 一覧の複数選択と一括残量／一括削除。
 * 単行編集の draft は触らず、一括前に onBeforeBulk（例: cancelEdit）だけ呼ぶ。
 */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  deleteItemsBulk,
  patchItemsBulk,
} from "@/lib/items/item-bulk-request";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

type UseItemsTableSelectionOptions = {
  items: ItemsTableRow[];
  /** 表示中行（全選択の対象） */
  sorted: ItemsTableRow[];
  setError: (message: string | null) => void;
  /** 一括操作の直前（編集中なら破棄する等） */
  onBeforeBulk?: () => void;
};

export function useItemsTableSelection({
  items,
  sorted,
  setError,
  onBeforeBulk,
}: UseItemsTableSelectionOptions) {
  const router = useRouter();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkStatus1, setBulkStatus1] = useState("");
  const [bulkPending, setBulkPending] = useState(false);

  // 一覧更新後に消えた id を選択から落とす
  const selectedIdList = useMemo(() => {
    const valid = new Set(items.map((item) => item.id));
    return [...selectedIds].filter((id) => valid.has(id));
  }, [items, selectedIds]);

  const selectedCount = selectedIdList.length;
  const allVisibleSelected =
    sorted.length > 0 && sorted.every((item) => selectedIds.has(item.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function toggleSelectAllVisible() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allVisibleSelected) {
        for (const item of sorted) {
          next.delete(item.id);
        }
      } else {
        for (const item of sorted) {
          next.add(item.id);
        }
      }
      return next;
    });
  }

  function clearSelection() {
    setSelectedIds(new Set());
  }

  function deselectId(id: string) {
    setSelectedIds((prev) => {
      if (!prev.has(id)) {
        return prev;
      }
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  }

  async function applyBulkStatus1() {
    if (selectedIdList.length === 0) {
      return;
    }

    setError(null);
    setBulkPending(true);
    onBeforeBulk?.();

    try {
      const result = await patchItemsBulk(selectedIdList, bulkStatus1);

      // 適用後はパネルを閉じる（失敗があってもメッセージは残す）
      clearSelection();

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.skipped > 0) {
        setError(
          `残量の一括更新で対象外の行がありました（${result.skipped} 件）`,
        );
      }

      if (result.affected > 0) {
        router.refresh();
      }
    } catch {
      setError("一括更新でエラーが発生しました");
      clearSelection();
    } finally {
      setBulkPending(false);
    }
  }

  async function removeSelected() {
    if (selectedIdList.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `選択した ${selectedIdList.length} 件を削除しますか？`,
      )
    ) {
      return;
    }

    setError(null);
    setBulkPending(true);
    onBeforeBulk?.();

    try {
      const result = await deleteItemsBulk(selectedIdList);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (result.affected > 0) {
        clearSelection();
        router.refresh();
      }

      if (result.skipped > 0) {
        setError(
          `削除できなかった行があります（${result.skipped} 件）`,
        );
      }
    } catch {
      setError("一括削除でエラーが発生しました");
    } finally {
      setBulkPending(false);
    }
  }

  return {
    selectedIds,
    selectedCount,
    allVisibleSelected,
    bulkStatus1,
    setBulkStatus1,
    bulkPending,
    toggleSelect,
    toggleSelectAllVisible,
    clearSelection,
    deselectId,
    applyBulkStatus1,
    removeSelected,
  };
}
