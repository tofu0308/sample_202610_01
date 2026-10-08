"use client";

/**
 * 複数選択時の一括操作バー。
 * 残量の一括変更と選択削除を、行ごとの操作と分けて置く。
 */

import {
  itemDangerButtonClass,
  itemPrimaryButtonClass,
  itemSecondaryButtonClass,
} from "@/components/items/item-action-styles";
import { Status1Meter } from "@/components/items/status1-meter";
import { STATUS1_OPTIONS } from "@/lib/items/constants";

type ItemsTableBulkToolbarProps = {
  selectedCount: number;
  bulkStatus1: string;
  pending: boolean;
  onBulkStatus1Change: (value: string) => void;
  onApplyStatus1: () => void;
  onRemoveSelected: () => void;
  onClearSelection: () => void;
};

export function ItemsTableBulkToolbar({
  selectedCount,
  bulkStatus1,
  pending,
  onBulkStatus1Change,
  onApplyStatus1,
  onRemoveSelected,
  onClearSelection,
}: ItemsTableBulkToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-sky-200 bg-sky-50 px-3 py-2 sm:flex-row sm:flex-wrap sm:items-center">
      <p className="text-sm font-medium text-sky-950">
        {selectedCount} 件選択中
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-xs text-zinc-700">
          <span className="whitespace-nowrap">残量を一括</span>
          <select
            value={bulkStatus1}
            onChange={(event) => onBulkStatus1Change(event.target.value)}
            disabled={pending}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500"
          >
            <option value="">未設定</option>
            {STATUS1_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
        <Status1Meter
          value={bulkStatus1 === "" ? null : bulkStatus1}
          compact
        />
        <button
          type="button"
          onClick={onApplyStatus1}
          disabled={pending}
          className={itemPrimaryButtonClass.sm}
        >
          {pending ? "適用中…" : "残量を適用"}
        </button>
        <button
          type="button"
          onClick={onRemoveSelected}
          disabled={pending}
          className={itemDangerButtonClass.sm}
        >
          選択を削除
        </button>
        <button
          type="button"
          onClick={onClearSelection}
          disabled={pending}
          className={itemSecondaryButtonClass.sm}
        >
          選択解除
        </button>
      </div>
    </div>
  );
}
