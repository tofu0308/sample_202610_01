/**
 * ログイン／登録フォーム共通の文言と見た目。
 * アプリのダーク寄りのトーンに合わせつつ、ラベルと入力のコントラストを確保する。
 */

/** アドレス欄の表示名（UI は「メール」に統一） */
export const AUTH_LABEL_EMAIL = "メール";
export const AUTH_LABEL_PASSWORD = "パスワード";
export const AUTH_LABEL_USERNAME = "ユーザーID";

export const authFormClassName = "space-y-5";

/** 1フィールド（ラベル＋入力＋補足）。間隔はラベル側の mb で約 4px */
export const authFieldClassName = "block text-sm";

export const authLabelClassName =
  "mb-1 block font-medium leading-snug text-white";

export const authHintClassName =
  "mt-1.5 block text-xs leading-relaxed text-zinc-400";

export const authInputClassName =
  "w-full rounded-md border border-zinc-600 bg-zinc-900 px-3 py-2.5 text-base text-zinc-100 outline-none placeholder:text-zinc-500 focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400 md:text-sm";

export const authPageDescClassName = "text-sm leading-relaxed text-zinc-300";

export const authFooterLinkClassName = "text-center text-sm text-zinc-300";
