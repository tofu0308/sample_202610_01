"use client";

/**
 * 登録一覧の 1 行。選択チェック・閲覧／編集・単行操作を担う。
 * 列順は「見たい情報」優先（商品名広め → 残量 → メモ → JAN）。
 */

import {
  itemDangerButtonClass,
  itemEditButtonClass,
  itemPrimaryButtonClass,
  itemSecondaryButtonClass,
} from "@/components/items/item-action-styles";
import { MemoCell } from "@/components/items/memo-cell";
import { Status1Meter } from "@/components/items/status1-meter";
import { STATUS1_OPTIONS } from "@/lib/items/constants";
import {
  formatDateTimeJstParts,
  type DateTimeJstParts,
} from "@/lib/items/format-datetime-jst";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

function DateTimeTwoLine({ parts }: { parts: DateTimeJstParts }) {
  return (
    <span className="flex flex-col leading-tight">
      <span>{parts.date}</span>
      <span className="text-zinc-400">{parts.time}</span>
    </span>
  );
}

type ItemsTableRowViewProps = {
  item: ItemsTableRow;
  selected: boolean;
  pending: boolean;
  editing: boolean;
  /** 一括処理中など、行操作を止めるとき */
  actionsDisabled: boolean;
  draftStatus1: string;
  draftNote: string;
  onToggleSelect: () => void;
  onDraftStatus1Change: (value: string) => void;
  onDraftNoteChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function ItemsTableRowView({
  item,
  selected,
  pending,
  editing,
  actionsDisabled,
  draftStatus1,
  draftNote,
  onToggleSelect,
  onDraftStatus1Change,
  onDraftNoteChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ItemsTableRowViewProps) {
  const registeredAt = formatDateTimeJstParts(item.createdAt);
  const updatedAt = formatDateTimeJstParts(item.updatedAt);
  const rowBusy = pending || actionsDisabled;

  return (
    <tr
      className={`border-b border-zinc-100 last:border-b-0 ${
        selected ? "bg-sky-50/70" : ""
      }`}
    >
      <td className="px-3 py-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          disabled={actionsDisabled}
          aria-label={`${item.product.name} を選択`}
          className="h-4 w-4 rounded border-zinc-300"
        />
      </td>
      <td className="px-3 py-2">
        {item.product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
          <img
            src={item.product.imageUrl}
            alt=""
            width={40}
            height={40}
            className="h-10 w-10 rounded border border-zinc-200 object-cover"
          />
        ) : (
          <div
            className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 text-[9px] text-zinc-400"
            aria-hidden
          >
            —
          </div>
        )}
      </td>
      <td className="min-w-[22rem] max-w-[28rem] px-3 py-2 font-medium text-zinc-900">
        <span className="line-clamp-2">{item.product.name}</span>
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
        {item.product.brandName ?? "—"}
      </td>
      <td className="px-3 py-2 text-zinc-700">
        {editing ? (
          <div className="space-y-1.5">
            <select
              value={draftStatus1}
              onChange={(event) => onDraftStatus1Change(event.target.value)}
              disabled={rowBusy}
              aria-label={`${item.product.name} の残量`}
              className="w-36 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500"
            >
              <option value="">未設定</option>
              {STATUS1_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {draftStatus1 !== "" &&
              !(STATUS1_OPTIONS as readonly string[]).includes(draftStatus1) ? (
                <option value={draftStatus1}>{draftStatus1}（旧）</option>
              ) : null}
            </select>
            <Status1Meter
              value={draftStatus1 === "" ? null : draftStatus1}
              compact
            />
          </div>
        ) : (
          <Status1Meter value={item.status1} />
        )}
      </td>
      {/* max-w だけでは表レイアウトで無視されがちなので幅＋ overflow を明示する */}
      <td className="w-40 max-w-[10rem] min-w-[10rem] overflow-hidden px-3 py-2 align-top text-zinc-600">
        {editing ? (
          <textarea
            value={draftNote}
            onChange={(event) => onDraftNoteChange(event.target.value)}
            maxLength={2000}
            rows={2}
            disabled={rowBusy}
            placeholder="メモ（任意）"
            aria-label={`${item.product.name} のメモ`}
            className="w-full rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500"
          />
        ) : (
          <MemoCell note={item.note} label={item.product.name} />
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-500">
        {item.product.jan}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
        <DateTimeTwoLine parts={registeredAt} />
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-xs text-zinc-500">
        <DateTimeTwoLine parts={updatedAt} />
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {editing ? (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={rowBusy}
                className={itemPrimaryButtonClass.sm}
              >
                {pending ? "保存中…" : "保存"}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={rowBusy}
                className={itemSecondaryButtonClass.sm}
              >
                キャンセル
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStartEdit}
              disabled={rowBusy}
              className={itemEditButtonClass.sm}
            >
              編集
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={rowBusy}
            className={itemDangerButtonClass.sm}
          >
            {pending && !editing ? "削除中…" : "削除"}
          </button>
        </div>
      </td>
    </tr>
  );
}
