"use client";

/**
 * 登録一覧テーブル（Client Component）。
 * 並べ替え・編集・削除の state は useItemsTable、行 UI は ItemsTableRowView に委譲する。
 */

import { ItemsTableRowView } from "@/components/items/items-table-row";
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
        表は横にスクロールできます。列見出しで並べ替え（既定は残量）。「編集」で残量・コメントを変更できます。
      </p>
      <div className="-mx-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-[56rem] w-full border-collapse text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th scope="col" className={itemsTableThClassName}>
                画像
              </th>
              <ItemsTableSortHeader
                label="JAN"
                column="jan"
                activeKey={table.sortKey}
                activeDir={table.sortDir}
                onSort={table.handleSort}
              />
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
                コメント
              </th>
              <ItemsTableSortHeader
                label="登録日"
                column="createdAt"
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
            {table.sorted.map((item) => (
              <ItemsTableRowView
                key={item.id}
                item={item}
                pending={table.pendingId === item.id}
                editing={table.editingId === item.id}
                anotherEditing={
                  table.editingId !== null && table.editingId !== item.id
                }
                draftStatus1={table.draftStatus1}
                draftNote={table.draftNote}
                onDraftStatus1Change={table.setDraftStatus1}
                onDraftNoteChange={table.setDraftNote}
                onStartEdit={() => table.startEdit(item)}
                onCancelEdit={table.cancelEdit}
                onSave={() => void table.saveEdit(item)}
                onDelete={() => void table.removeItem(item)}
              />
            ))}
          </tbody>
        </table>
      </div>
      {table.error ? (
        <p className="text-sm text-red-600">{table.error}</p>
      ) : null}
    </div>
  );
}
