/**
 * 登録まわりのサーバ側定数。
 * いまはログインがないので、固定のユーザー ID で 1 人分だけ扱う。
 */

/**
 * ログイン導入前に使っていた固定 userId。
 * 既存行の付け替え用に残す（アプリ実行時の書き込み先には使わない）。
 */
export const LEGACY_DEV_USER_ID = "local-dev-user";

/** 用途の初期値（消耗品・塗料）。あとで本など別用途を足す想定 */
export const DEFAULT_PRESET_KEY = "paint";

/**
 * status1（残量感）の候補。配列順＝多い→少ない。
 * プルダウン・zod・ソート順で同じ並びを使う。
 */
export const STATUS1_OPTIONS = [
  "満タン",
  "余裕あり",
  "半分",
  "残少",
  "要補充",
] as const;

export type Status1Option = (typeof STATUS1_OPTIONS)[number];

/** ソート用。未設定は末尾（大きい rank） */
export const STATUS1_SORT_RANK: Record<Status1Option, number> = {
  満タン: 0,
  余裕あり: 1,
  半分: 2,
  残少: 3,
  要補充: 4,
};

export function isStatus1Option(value: string): value is Status1Option {
  return (STATUS1_OPTIONS as readonly string[]).includes(value);
}
