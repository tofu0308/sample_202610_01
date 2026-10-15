/**
 * `/auth/callback` が付与する ?error= を表示文言に変換する（アプリ独自のクエリ値）。
 * 設定箇所: src/app/auth/callback/route.ts
 * - auth_callback_failed … code 欠落 or exchangeCodeForSession 失敗
 * - profile_* … ensureProfileForAuthUser の reason
 */

export function toCallbackErrorMessage(
  error: string | undefined,
): string | null {
  switch (error) {
    case "auth_callback_failed":
      return "確認リンクの処理に失敗しました。もう一度ログインを試してください。";
    case "profile_missing_username":
      return "ユーザーIDの情報が見つかりませんでした。新規登録からやり直してください。";
    case "profile_username_taken":
      return "そのユーザーIDは既に使われています。別のユーザーIDで登録してください。";
    case "profile_unknown":
      return "プロフィールの準備に失敗しました。時間をおいて再度お試しください。";
    default:
      return null;
  }
}
