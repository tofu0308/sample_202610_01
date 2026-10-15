/**
 * 登録一覧テーブル用 hook の組み立て。
 * 検索・ソート／単行編集／選択・一括を分け、ここは共有 error と接続だけ担う。
 */

import { useEffect, useRef, useState } from "react";
import { useItemsTableEditing } from "@/hooks/items/use-items-table-editing";
import { useItemsTableQuery } from "@/hooks/items/use-items-table-query";
import { useItemsTableSelection } from "@/hooks/items/use-items-table-selection";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

export function useItemsTable(items: ItemsTableRow[]) {
  const [error, setError] = useState<string | null>(null);
  // 編集 → 選択の順で組み立てるため、削除後の選択解除だけ ref 経由（render 中は触らない）
  const deselectIdRef = useRef<(id: string) => void>(() => {});

  const query = useItemsTableQuery(items);
  const editing = useItemsTableEditing({
    setError,
    onItemDeleted: (id) => {
      deselectIdRef.current(id);
    },
  });
  const selection = useItemsTableSelection({
    items,
    sorted: query.sorted,
    setError,
    onBeforeBulk: editing.cancelEdit,
  });

  useEffect(() => {
    deselectIdRef.current = selection.deselectId;
  }, [selection.deselectId]);

  const busy = selection.bulkPending || editing.pendingId !== null;

  return {
    sorted: query.sorted,
    totalCount: query.totalCount,
    matchCount: query.matchCount,
    searchQuery: query.searchQuery,
    setSearchQuery: query.setSearchQuery,
    searchIncludeNote: query.searchIncludeNote,
    setSearchIncludeNote: query.setSearchIncludeNote,
    searchIncludeJan: query.searchIncludeJan,
    setSearchIncludeJan: query.setSearchIncludeJan,
    sortKey: query.sortKey,
    sortDir: query.sortDir,
    handleSort: query.handleSort,
    pendingId: editing.pendingId,
    bulkPending: selection.bulkPending,
    busy,
    editingId: editing.editingId,
    draftStatus1: editing.draftStatus1,
    setDraftStatus1: editing.setDraftStatus1,
    draftNote: editing.draftNote,
    setDraftNote: editing.setDraftNote,
    selectedIds: selection.selectedIds,
    selectedCount: selection.selectedCount,
    allVisibleSelected: selection.allVisibleSelected,
    bulkStatus1: selection.bulkStatus1,
    setBulkStatus1: selection.setBulkStatus1,
    error,
    toggleSelect: selection.toggleSelect,
    toggleSelectAllVisible: selection.toggleSelectAllVisible,
    clearSelection: selection.clearSelection,
    startEdit: editing.startEdit,
    cancelEdit: editing.cancelEdit,
    saveEdit: editing.saveEdit,
    removeItem: editing.removeItem,
    applyBulkStatus1: selection.applyBulkStatus1,
    removeSelected: selection.removeSelected,
  };
}
