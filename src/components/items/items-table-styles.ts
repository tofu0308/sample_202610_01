/**
 * 登録一覧テーブル用の見た目定数。
 * ボタン類（item-action-styles）とは分け、表レイアウトの入口を分かりやすくする。
 */

/** PC の縦スクロール領域内で追従するため sticky（背景は行が透けないよう必須） */
export const itemsTableThClassName =
  "sticky top-0 z-10 whitespace-nowrap bg-zinc-50 px-3 py-2 text-left text-xs font-medium text-zinc-600 shadow-[inset_0_-1px_0_0_#e4e4e7]";

/**
 * ライトな表島向けの入力。
 * auth のダーク入力（form-styles）と対になる。
 */
export const itemsTableInputClassName =
  "rounded-md border border-zinc-300 bg-white px-2 py-1 text-base text-zinc-900 outline-none focus:border-zinc-500 md:text-sm";

export const itemsTableTextareaClassName =
  "w-full rounded-md border border-zinc-300 px-2 py-1 text-base outline-none focus:border-zinc-500 md:text-sm";

export const itemsTableSearchInputClassName =
  "w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-base text-zinc-900 outline-none focus:border-zinc-500 md:text-sm";
