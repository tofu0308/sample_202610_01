/**
 * 登録一覧テーブルの state / 操作フロー。
 * 単行のインライン編集に加え、複数選択での残量一括・一覧からの削除を扱う。
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  deleteItem,
  patchItem,
} from "@/lib/items/item-mutation-request";
import {
  sortItemsTableRows,
  type ItemsTableRow,
  type ItemsTableSortDir,
  type ItemsTableSortKey,
} from "@/lib/items/items-table-sort";

export function useItemsTable(items: ItemsTableRow[]) {
  const router = useRouter();
  // 消耗品管理では残量でまとめて見ることが多いので既定ソートにする
  const [sortKey, setSortKey] = useState<ItemsTableSortKey>("status1");
  const [sortDir, setSortDir] = useState<ItemsTableSortDir>("asc");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [bulkPending, setBulkPending] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftStatus1, setDraftStatus1] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const [bulkStatus1, setBulkStatus1] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => sortItemsTableRows(items, sortKey, sortDir),
    [items, sortKey, sortDir],
  );

  // 一覧更新後に消えた id を選択から落とす
  const selectedIdList = useMemo(() => {
    const valid = new Set(items.map((item) => item.id));
    return [...selectedIds].filter((id) => valid.has(id));
  }, [items, selectedIds]);

  const selectedCount = selectedIdList.length;
  const allVisibleSelected =
    sorted.length > 0 && sorted.every((item) => selectedIds.has(item.id));

  const busy = bulkPending || pendingId !== null;

  function handleSort(key: ItemsTableSortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

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

  function startEdit(item: ItemsTableRow) {
    setError(null);
    setEditingId(item.id);
    setDraftStatus1(item.status1 ?? "");
    setDraftNote(item.note ?? "");
  }

  function cancelEdit() {
    setEditingId(null);
    setDraftStatus1("");
    setDraftNote("");
    setError(null);
  }

  async function saveEdit(item: ItemsTableRow) {
    setError(null);
    setPendingId(item.id);

    const result = await patchItem(item.id, {
      status1: draftStatus1,
      note: draftNote,
    });

    if (!result.ok) {
      setError(result.message);
      setPendingId(null);
      return;
    }

    setEditingId(null);
    setPendingId(null);
    router.refresh();
  }

  async function removeItem(item: ItemsTableRow) {
    if (!window.confirm(`「${item.product.name}」の登録を削除しますか？`)) {
      return;
    }

    setError(null);
    setPendingId(item.id);

    const result = await deleteItem(item.id);

    if (!result.ok) {
      setError(result.message);
      setPendingId(null);
      return;
    }

    if (editingId === item.id) {
      cancelEdit();
    }
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(item.id);
      return next;
    });
    setPendingId(null);
    router.refresh();
  }

  /** 選択行へ同じ残量を一括適用。TODO: 一括 PATCH API に差し替え */
  async function applyBulkStatus1() {
    if (selectedIdList.length === 0) {
      return;
    }

    setError(null);
    setBulkPending(true);
    cancelEdit();

    let failed = 0;
    let lastError: string | null = null;

    for (const id of selectedIdList) {
      const result = await patchItem(id, { status1: bulkStatus1 });
      if (!result.ok) {
        failed += 1;
        lastError = result.message;
      }
    }

    setBulkPending(false);
    // 適用後はパネルを閉じる（失敗があってもメッセージは残す）
    clearSelection();

    if (failed > 0) {
      setError(
        lastError ??
          `残量の一括更新に失敗した行があります（${failed} 件）`,
      );
    }

    if (failed < selectedIdList.length) {
      router.refresh();
    }
  }

  /** 選択行を順に削除。TODO: 一括 DELETE API に差し替え */
  async function removeSelected() {
    if (selectedIdList.length === 0) {
      return;
    }

    if (
      !window.confirm(
        `選択した ${selectedIdList.length} 件を一覧から削除しますか？`,
      )
    ) {
      return;
    }

    setError(null);
    setBulkPending(true);
    cancelEdit();

    let failed = 0;
    let lastError: string | null = null;
    const deletedIds: string[] = [];

    for (const id of selectedIdList) {
      const result = await deleteItem(id);
      if (result.ok) {
        deletedIds.push(id);
      } else {
        failed += 1;
        lastError = result.message;
      }
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const id of deletedIds) {
        next.delete(id);
      }
      return next;
    });
    setBulkPending(false);

    if (failed > 0) {
      setError(
        lastError ?? `削除に失敗した行があります（${failed} 件）`,
      );
    }

    if (deletedIds.length > 0) {
      router.refresh();
    }
  }

  return {
    sorted,
    sortKey,
    sortDir,
    handleSort,
    pendingId,
    bulkPending,
    busy,
    editingId,
    draftStatus1,
    setDraftStatus1,
    draftNote,
    setDraftNote,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    bulkStatus1,
    setBulkStatus1,
    error,
    toggleSelect,
    toggleSelectAllVisible,
    clearSelection,
    startEdit,
    cancelEdit,
    saveEdit,
    removeItem,
    applyBulkStatus1,
    removeSelected,
  };
}
