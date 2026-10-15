/**
 * 一覧の単行インライン編集・単件削除。
 * 選択や一括 API は扱わない（削除後の選択解除だけコールバックで親に伝える）。
 */

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  deleteItem,
  patchItem,
} from "@/lib/items/item-mutation-request";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

type UseItemsTableEditingOptions = {
  setError: (message: string | null) => void;
  /** 削除成功後に選択 Set から外すなど */
  onItemDeleted?: (id: string) => void;
};

export function useItemsTableEditing({
  setError,
  onItemDeleted,
}: UseItemsTableEditingOptions) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draftStatus1, setDraftStatus1] = useState("");
  const [draftNote, setDraftNote] = useState("");

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

    try {
      const result = await patchItem(item.id, {
        status1: draftStatus1,
        note: draftNote,
      });

      if (!result.ok) {
        setError(result.message);
        return;
      }

      setEditingId(null);
      router.refresh();
    } catch {
      setError("更新処理でエラーが発生しました");
    } finally {
      setPendingId(null);
    }
  }

  async function removeItem(item: ItemsTableRow) {
    if (!window.confirm(`「${item.product.name}」の登録を削除しますか？`)) {
      return;
    }

    setError(null);
    setPendingId(item.id);

    try {
      const result = await deleteItem(item.id);

      if (!result.ok) {
        setError(result.message);
        return;
      }

      if (editingId === item.id) {
        cancelEdit();
      }
      onItemDeleted?.(item.id);
      router.refresh();
    } catch {
      setError("削除処理でエラーが発生しました");
    } finally {
      setPendingId(null);
    }
  }

  return {
    pendingId,
    editingId,
    draftStatus1,
    setDraftStatus1,
    draftNote,
    setDraftNote,
    startEdit,
    cancelEdit,
    saveEdit,
    removeItem,
  };
}
