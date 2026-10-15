/**
 * 登録まわりの操作ボタン用クラス。
 * 主操作はライト面向けの暗い塗り（方針は `ui/button-styles` と同じ）。
 * `row` は一覧の行操作向け（モバイルで押しやすい高さ）。一括バー等は `sm` のまま。
 */

const base =
  "rounded-md font-medium disabled:cursor-not-allowed disabled:opacity-50";

/** 行操作向け。おおよそ 44px をモバイルで確保し、md+ で表向けに戻す */
const rowTouch = "min-h-11 px-3 py-2.5 text-xs md:min-h-0 md:px-2 md:py-1";

export const itemPrimaryButtonClass = {
  sm: `${base} bg-zinc-900 px-2 py-1 text-xs text-white`,
  /** 一覧行の保存など */
  row: `${base} bg-zinc-900 ${rowTouch} text-white`,
  md: `${base} bg-zinc-900 px-3 py-1.5 text-sm text-white`,
  compact: `${base} bg-zinc-900 px-2.5 py-1 text-xs text-white`,
} as const;

export const itemSecondaryButtonClass = {
  // 枠線ボタン。ダーク page の color 継承で文字が消えないよう色を明示する
  sm: `${base} border border-zinc-300 bg-white px-2 py-1 text-xs text-zinc-800 hover:bg-zinc-50`,
  row: `${base} border border-zinc-300 bg-white ${rowTouch} text-zinc-800 hover:bg-zinc-50`,
} as const;

/** 選択解除など、枠線だけだと埋もれる操作用 */
export const itemNeutralButtonClass = {
  sm: `${base} bg-zinc-600 px-2 py-1 text-xs text-white hover:bg-zinc-700`,
} as const;

/** 編集は操作の入口なので、枠線だけより塗りで目立たせる */
export const itemEditButtonClass = {
  sm: `${base} bg-sky-600 px-2 py-1 text-xs text-white hover:bg-sky-700`,
  row: `${base} bg-sky-600 ${rowTouch} text-white hover:bg-sky-700`,
} as const;

export const itemDangerButtonClass = {
  sm: `${base} border border-red-200 px-2 py-1 text-xs text-red-700`,
  row: `${base} border border-red-200 ${rowTouch} text-red-700`,
} as const;

/**
 * 表ヘッダの共通スタイル。
 * PC の縦スクロール領域内で追従するため sticky（背景は行が透けないよう必須）。
 */
export const itemsTableThClassName =
  "sticky top-0 z-10 whitespace-nowrap bg-zinc-50 px-3 py-2 text-left text-xs font-medium text-zinc-600 shadow-[inset_0_-1px_0_0_#e4e4e7]";
