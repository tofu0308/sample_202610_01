/**
 * ログイン失敗を画面向け日本語にする。
 * 英語の生メッセージは出さない。存在有無の切り分けも避ける。
 *
 * 公式:
 * - https://supabase.com/docs/reference/javascript/auth-signinwithpassword
 * - https://supabase.com/docs/guides/auth/debugging/error-codes
 * - https://supabase.com/docs/guides/api/handling-errors-in-supabase-js
 */

export function toLoginErrorMessage(error: {
  message?: string;
  code?: string;
} | null): string {
  const raw = `${error?.code ?? ""} ${error?.message ?? ""}`.toLowerCase();

  if (
    raw.includes("email_not_confirmed") ||
    raw.includes("email not confirmed") ||
    raw.includes("not confirmed")
  ) {
    return "メールアドレスの確認が完了していません。確認メールをご確認ください。";
  }

  if (
    raw.includes("too_many") ||
    raw.includes("rate limit") ||
    raw.includes("too many")
  ) {
    return "試行回数が多すぎます。しばらくしてから再度お試しください。";
  }

  if (
    raw.includes("invalid_credentials") ||
    raw.includes("invalid login") ||
    raw.includes("invalid email or password")
  ) {
    return "メールまたはパスワードが正しくありません。";
  }

  return "ログインに失敗しました。";
}
