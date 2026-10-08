"use client";

/**
 * 登録一覧テーブル（Client Component）。
 * 並べ替え・編集・選択一括は useItemsTable、行 UI は ItemsTableRowView に委譲する。
 */

import { ItemsTableBulkToolbar } from "@/components/items/items-table-bulk-toolbar";
import { ItemsTableRowView } from "@/components/items/items-table-row";
import { ItemsTableSearch } from "@/components/items/items-table-search";
import { ItemsTableSortHeader } from "@/components/items/items-table-sort-header";
import { itemsTableThClassName } from "@/components/items/item-action-styles";
import { useItemsTable } from "@/hooks/items/use-items-table";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

export type { ItemsTableRow };

type ItemsTableProps = {
  items: ItemsTableRow[];
};

export function ItemsTable({ items }: ItemsTableProps) {
  const table = useItemsTable(items);

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        表は横にスクロールできます。列見出しで並べ替え（既定は残量）。行を選ぶと上部に一括バーが出ます（残量の適用・選択解除・一覧から削除）。メモは行の「編集」から。
      </p>
      <ItemsTableSearch
        query={table.searchQuery}
        includeNote={table.searchIncludeNote}
        includeJan={table.searchIncludeJan}
        matchCount={table.matchCount}
        totalCount={table.totalCount}
        onQueryChange={table.setSearchQuery}
        onIncludeNoteChange={table.setSearchIncludeNote}
        onIncludeJanChange={table.setSearchIncludeJan}
      />
      <ItemsTableBulkToolbar
        selectedCount={table.selectedCount}
        bulkStatus1={table.bulkStatus1}
        pending={table.bulkPending}
        onBulkStatus1Change={table.setBulkStatus1}
        onApplyStatus1={() => void table.applyBulkStatus1()}
        onRemoveSelected={() => void table.removeSelected()}
        onClearSelection={table.clearSelection}
      />
      <div className="-mx-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-[64rem] w-full border-collapse text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th scope="col" className={itemsTableThClassName}>
                <input
                  type="checkbox"
                  checked={table.allVisibleSelected}
                  onChange={table.toggleSelectAllVisible}
                  disabled={table.busy || table.sorted.length === 0}
                  aria-label="表示中の行をすべて選択"
                  className="h-4 w-4 rounded border-zinc-300"
                />
              </th>
              <th scope="col" className={itemsTableThClassName}>
                画像
              </th>
              <ItemsTableSortHeader
                label="商品名"
                column="name"
                activeKey={table.sortKey}
                activeDir={table.sortDir}
                onSort={table.handleSort}
              />
              <th scope="col" className={itemsTableThClassName}>
                ブランド
              </th>
              <ItemsTableSortHeader
                label="残量"
                column="status1"
                activeKey={table.sortKey}
                activeDir={table.sortDir}
                onSort={table.handleSort}
              />
              <th
                scope="col"
                className="min-w-[10rem] px-3 py-2 text-left text-xs font-medium text-zinc-600"
              >
                メモ
              </th>
              <ItemsTableSortHeader
                label="JAN"
                column="jan"
                activeKey={table.sortKey}
                activeDir={table.sortDir}
                onSort={table.handleSort}
              />
              <ItemsTableSortHeader
                label="登録日"
                column="createdAt"
                activeKey={table.sortKey}
                activeDir={table.sortDir}
                onSort={table.handleSort}
              />
              <ItemsTableSortHeader
                label="更新日"
                column="updatedAt"
                activeKey={table.sortKey}
                activeDir={table.sortDir}
                onSort={table.handleSort}
              />
              <th scope="col" className={itemsTableThClassName}>
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {table.sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="px-3 py-8 text-center text-sm text-zinc-500"
                >
                  {table.searchQuery.trim() !== ""
                    ? "条件に一致する登録がありません。"
                    : "表示できる登録がありません。"}
                </td>
              </tr>
            ) : (
              table.sorted.map((item) => (
                <ItemsTableRowView
                  key={item.id}
                  item={item}
                  selected={table.selectedIds.has(item.id)}
                  pending={
                    table.pendingId === item.id ||
                    (table.bulkPending && table.selectedIds.has(item.id))
                  }
                  editing={table.editingId === item.id}
                  actionsDisabled={table.bulkPending}
                  draftStatus1={table.draftStatus1}
                  draftNote={table.draftNote}
                  onToggleSelect={() => table.toggleSelect(item.id)}
                  onDraftStatus1Change={table.setDraftStatus1}
                  onDraftNoteChange={table.setDraftNote}
                  onStartEdit={() => table.startEdit(item)}
                  onCancelEdit={table.cancelEdit}
                  onSave={() => void table.saveEdit(item)}
                  onDelete={() => void table.removeItem(item)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
      {table.error ? (
        <p className="text-sm text-red-600">{table.error}</p>
      ) : null}
    </div>
  );
}
