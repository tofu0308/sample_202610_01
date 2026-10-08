/**
 * 登録まわりのサーバ側定数。
 * いまはログインがないので、固定のユーザー ID で 1 人分だけ扱う。
 */

/** ログイン導入前の固定ユーザー ID。ブラウザからは受け取らず、サーバだけで付ける */
export const DEV_USER_ID = "local-dev-user";

/** 用途の初期値（消耗品・塗料）。あとで本など別用途を足す想定 */
export const DEFAULT_PRESET_KEY = "paint";
