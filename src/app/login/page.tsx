/**
 * ログイン画面（公開）。
 * 未登録の人は /signup へ誘導する。
 */

import { LoginForm } from "@/components/auth/login-form";
import { authPageDescClassName } from "@/components/auth/form-styles";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          ログイン
        </h1>
        <p className={authPageDescClassName}>
          Emailとパスワードでログインしてください。
        </p>
      </header>
      <LoginForm nextPath={nextPath} initialError={params.error ?? null} />
    </main>
  );
}
