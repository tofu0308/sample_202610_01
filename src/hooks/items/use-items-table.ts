/**
 * 登録一覧テーブルの state / 操作フロー。
 * ソート・インライン編集・削除をここに集め、表コンポーネントは表示に専念させる。
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
  // 消耗品管理ではステータスでまとめて見ることが多いので既定ソートにする
  const [sortKey, setSortKey] = useState<ItemsTableSortKey>("status1");
  const [sortDir, setSortDir] = useState<ItemsTableSortDir>("asc");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftStatus1, setDraftStatus1] = useState("");
  const [draftNote, setDraftNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => sortItemsTableRows(items, sortKey, sortDir),
    [items, sortKey, sortDir],
  );

  function handleSort(key: ItemsTableSortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
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
    setPendingId(null);
    router.refresh();
  }

  return {
    sorted,
    sortKey,
    sortDir,
    handleSort,
    pendingId,
    editingId,
    draftStatus1,
    setDraftStatus1,
    draftNote,
    setDraftNote,
    error,
    startEdit,
    cancelEdit,
    saveEdit,
    removeItem,
  };
}
