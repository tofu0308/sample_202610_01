/**
 * 登録（UserItem）まわりのサーバ側定数。
 * 認証前は仮 userId で単一ユーザー運用し、Phase 4 で Auth の uid に差し替える。
 */

/** 認証導入前の仮ユーザー ID。クライアントから受け取らずサーバで付与する */
export const DEV_USER_ID = "local-dev-user";

/** 用途プリセットの初期値（消耗品・塗料）。将来 book 等を足す */
export const DEFAULT_PRESET_KEY = "paint";
