/**
 * 新パスワード設定画面。
 * リセットメール → /auth/callback でセッション確立後にここに着地する（要ログイン）。
 */

import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { requireUserForPage } from "@/lib/auth/require-user";

export default async function UpdatePasswordPage() {
  await requireUserForPage();

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <AuthPageHeader
        title="新しいパスワード"
        description="新しいパスワードを入力してください。更新後はそのままアプリを利用できます。"
      />
      <UpdatePasswordForm />
    </main>
  );
}
