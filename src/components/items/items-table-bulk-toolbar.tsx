"use client";

/**
 * 複数選択時の一括操作バー。
 * 表の段落ちを避けるためサイト上部に fixed 表示する。
 */

import {
  itemDangerButtonClass,
  itemNeutralButtonClass,
  itemPrimaryButtonClass,
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
    <div className="fixed inset-x-0 top-0 z-50 border-b border-sky-200 bg-sky-50/95 shadow-sm backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 py-2.5 sm:flex-row sm:items-center sm:gap-3">
        <p className="shrink-0 text-sm font-medium text-sky-950">
          {selectedCount} 件選択中
        </p>

        <label className="flex shrink-0 items-center gap-2 text-xs text-zinc-700">
          <span className="whitespace-nowrap">残量を一括</span>
          <select
            value={bulkStatus1}
            onChange={(event) => onBulkStatus1Change(event.target.value)}
            disabled={pending}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1 text-base outline-none focus:border-zinc-500 md:text-sm"
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

        {/* 左: 適用・選択解除 / 右: 削除（誤認しにくい並び） */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onApplyStatus1}
            disabled={pending}
            className={itemPrimaryButtonClass.sm}
          >
            {pending ? "適用中…" : "適用"}
          </button>
          <button
            type="button"
            onClick={onClearSelection}
            disabled={pending}
            className={itemNeutralButtonClass.sm}
          >
            選択解除
          </button>
          <button
            type="button"
            onClick={onRemoveSelected}
            disabled={pending}
            className={`${itemDangerButtonClass.sm} ml-auto`}
          >
            一覧から削除
          </button>
        </div>
      </div>
    </div>
  );
}
