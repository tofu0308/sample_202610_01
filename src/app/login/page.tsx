/**
 * ログイン画面（公開）。
 * 未登録の人は /signup へ誘導する。
 */

import { LoginForm } from "@/components/auth/login-form";
import { authPageDescClassName } from "@/components/auth/form-styles";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

/**
 * `/auth/callback` が付与する ?error= を表示文言に変換する（アプリ独自のクエリ値）。
 * 設定箇所: src/app/auth/callback/route.ts
 * - auth_callback_failed … code 欠落 or exchangeCodeForSession 失敗
 *   https://supabase.com/docs/reference/javascript/auth-exchangecodeforsession
 * - profile_* … ensureProfileForAuthUser の reason（src/lib/auth/ensure-profile.ts）
 *   profile_username_taken の元は Prisma P2002（unique 違反）
 *   https://www.prisma.io/docs/orm/reference/error-reference#p2002
 */
function callbackErrorMessage(error: string | undefined): string | null {
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

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/";
  const bannerError = callbackErrorMessage(params.error);
  const formInitialError =
    params.error && !bannerError ? params.error : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          ログイン
        </h1>
        <p className={authPageDescClassName}>
          Emailとパスワードでログインしてください。
        </p>
        {bannerError ? (
          <p className="text-sm text-red-400">{bannerError}</p>
        ) : null}
      </header>
      <LoginForm nextPath={nextPath} initialError={formInitialError} />
    </main>
  );
}
