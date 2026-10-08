/**
 * 登録まわりの操作ボタン用クラス。
 * 表の編集／削除と登録ボタンで見た目を揃える（サイズだけ差し替え）。
 */

const base =
  "rounded-md font-medium disabled:cursor-not-allowed disabled:opacity-50";

export const itemPrimaryButtonClass = {
  sm: `${base} bg-zinc-900 px-2 py-1 text-xs text-white`,
  md: `${base} bg-zinc-900 px-3 py-1.5 text-sm text-white`,
  compact: `${base} bg-zinc-900 px-2.5 py-1 text-xs text-white`,
} as const;

export const itemSecondaryButtonClass = {
  sm: `${base} border border-zinc-300 px-2 py-1 text-xs`,
} as const;

/** 選択解除など、枠線だけだと埋もれる操作用 */
export const itemNeutralButtonClass = {
  sm: `${base} bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-700`,
} as const;

/** 編集は操作の入口なので、枠線だけより塗りで目立たせる */
export const itemEditButtonClass = {
  sm: `${base} bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700`,
} as const;

export const itemDangerButtonClass = {
  sm: `${base} border border-red-200 px-2 py-1 text-xs text-red-700`,
} as const;

/** 表ヘッダの共通スタイル（ソート有無で th を揃える） */
export const itemsTableThClassName =
  "whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-600";
