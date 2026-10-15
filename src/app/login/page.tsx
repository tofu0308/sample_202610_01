/**
 * ログイン画面（公開）。
 * 未登録の人は /signup へ誘導する。
 */

import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { LoginForm } from "@/components/auth/login-form";
import { toCallbackErrorMessage } from "@/lib/auth/callback-error-message";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath =
    params.next && params.next.startsWith("/") ? params.next : "/";
  const bannerError = toCallbackErrorMessage(params.error);
  const formInitialError =
    params.error && !bannerError ? params.error : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <AuthPageHeader
        title="ログイン"
        description="メールとパスワードでログインしてください。"
      >
        {bannerError ? (
          <p className="text-sm text-red-400">{bannerError}</p>
        ) : null}
      </AuthPageHeader>
      <LoginForm nextPath={nextPath} initialError={formInitialError} />
    </main>
  );
}
