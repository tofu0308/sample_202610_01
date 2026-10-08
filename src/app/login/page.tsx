/**
 * 管理者ログイン（公開ユーザー登録は作らない）。
 * Supabase Dashboard で自分のユーザーを先に作ってから使う。
 */

import { LoginForm } from "@/components/auth/login-form";

type LoginPageProps = {
  searchParams: Promise<{ next?: string; error?: string }>;
};

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const params = await searchParams;
  const nextPath = params.next && params.next.startsWith("/") ? params.next : "/";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">ログイン</h1>
        <p className="text-sm text-zinc-600">
          管理者用です。アカウントはアプリからは作れません（Supabase
          Auth で事前作成）。
        </p>
      </header>
      <LoginForm nextPath={nextPath} initialError={params.error ?? null} />
    </main>
  );
}
