/**
 * ソート可能な表ヘッダ。aria-sort は th に置き、ボタンは見た目のクリック領域。
 */

import {
  itemsTableThClassName,
} from "@/components/items/item-action-styles";
import type {
  ItemsTableSortDir,
  ItemsTableSortKey,
} from "@/lib/items/items-table-sort";

type ItemsTableSortHeaderProps = {
  label: string;
  column: ItemsTableSortKey;
  activeKey: ItemsTableSortKey;
  activeDir: ItemsTableSortDir;
  onSort: (key: ItemsTableSortKey) => void;
};

export function ItemsTableSortHeader({
  label,
  column,
  activeKey,
  activeDir,
  onSort,
}: ItemsTableSortHeaderProps) {
  const active = activeKey === column;
  const indicator = active ? (activeDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <th
      scope="col"
      aria-sort={
        active ? (activeDir === "asc" ? "ascending" : "descending") : "none"
      }
      className={itemsTableThClassName}
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center rounded px-0.5 hover:text-zinc-900"
      >
        {label}
        <span className="text-zinc-400" aria-hidden>
          {indicator || " ↕"}
        </span>
      </button>
    </th>
  );
}
