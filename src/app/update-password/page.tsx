/**
 * 新パスワード設定画面。
 * リセットメール → /auth/callback でセッション確立後にここに着地する（要ログイン）。
 */

import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { authPageDescClassName } from "@/components/auth/form-styles";
import { requireUserForPage } from "@/lib/auth/require-user";

export default async function UpdatePasswordPage() {
  await requireUserForPage();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          新しいパスワード
        </h1>
        <p className={authPageDescClassName}>
          新しいパスワードを入力してください。更新後はそのままアプリを利用できます。
        </p>
      </header>
      <UpdatePasswordForm />
    </main>
  );
}
