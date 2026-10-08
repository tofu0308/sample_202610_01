"use client";

/**
 * 登録一覧の 1 行。閲覧／編集モードの切り替えと操作ボタンを担う。
 */

import {
  itemDangerButtonClass,
  itemEditButtonClass,
  itemPrimaryButtonClass,
  itemSecondaryButtonClass,
} from "@/components/items/item-action-styles";
import { Status1Meter } from "@/components/items/status1-meter";
import { STATUS1_OPTIONS } from "@/lib/items/constants";
import type { ItemsTableRow } from "@/lib/items/items-table-sort";

type ItemsTableRowViewProps = {
  item: ItemsTableRow;
  pending: boolean;
  editing: boolean;
  /** 他行を編集中のとき「編集」を無効化するため */
  anotherEditing: boolean;
  draftStatus1: string;
  draftNote: string;
  onDraftStatus1Change: (value: string) => void;
  onDraftNoteChange: (value: string) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSave: () => void;
  onDelete: () => void;
};

export function ItemsTableRowView({
  item,
  pending,
  editing,
  anotherEditing,
  draftStatus1,
  draftNote,
  onDraftStatus1Change,
  onDraftNoteChange,
  onStartEdit,
  onCancelEdit,
  onSave,
  onDelete,
}: ItemsTableRowViewProps) {
  const registeredAt = new Date(item.createdAt).toLocaleDateString("ja-JP");

  return (
    <tr className="border-b border-zinc-100 last:border-b-0">
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
      <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-600">
        {item.product.jan}
      </td>
      <td className="max-w-[16rem] px-3 py-2 font-medium text-zinc-900">
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
              disabled={pending}
              aria-label={`${item.product.name} の残量`}
              className="w-36 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500"
            >
              <option value="">未設定</option>
              {STATUS1_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
              {/* 旧データなど候補外の値があるときは、消さないよう一時表示 */}
              {draftStatus1 !== "" &&
              !(STATUS1_OPTIONS as readonly string[]).includes(draftStatus1) ? (
                <option value={draftStatus1}>{draftStatus1}（旧）</option>
              ) : null}
            </select>
            {/* 選択中の残量感をその場で確認できるようにする */}
            <Status1Meter
              value={draftStatus1 === "" ? null : draftStatus1}
              compact
            />
          </div>
        ) : (
          <Status1Meter value={item.status1} />
        )}
      </td>
      <td className="max-w-[14rem] px-3 py-2 text-zinc-600">
        {editing ? (
          <textarea
            value={draftNote}
            onChange={(event) => onDraftNoteChange(event.target.value)}
            maxLength={2000}
            rows={2}
            disabled={pending}
            placeholder="コメント（任意）"
            aria-label={`${item.product.name} のコメント`}
            className="w-full min-w-[10rem] rounded-md border border-zinc-300 px-2 py-1 text-sm outline-none focus:border-zinc-500"
          />
        ) : (
          <span className="line-clamp-2">{item.note ?? "—"}</span>
        )}
      </td>
      <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
        {registeredAt}
      </td>
      <td className="whitespace-nowrap px-3 py-2">
        <div className="flex flex-wrap gap-1">
          {editing ? (
            <>
              <button
                type="button"
                onClick={onSave}
                disabled={pending}
                className={itemPrimaryButtonClass.sm}
              >
                {pending ? "保存中…" : "保存"}
              </button>
              <button
                type="button"
                onClick={onCancelEdit}
                disabled={pending}
                className={itemSecondaryButtonClass.sm}
              >
                キャンセル
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={onStartEdit}
              disabled={pending || anotherEditing}
              className={itemEditButtonClass.sm}
            >
              編集
            </button>
          )}
          <button
            type="button"
            onClick={onDelete}
            disabled={pending}
            className={itemDangerButtonClass.sm}
          >
            {pending && !editing ? "削除中…" : "削除"}
          </button>
        </div>
      </td>
    </tr>
  );
}
