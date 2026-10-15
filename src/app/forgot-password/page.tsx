/**
 * パスワード再設定の依頼画面（公開）。
 * メール送信のみ。リンク先の新パスワード入力は後続工程。
 */

import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <AuthPageHeader
        title="パスワード再設定"
        description="登録したメールを入力してください。再設定用のリンクを送ります。"
      />
      <ForgotPasswordForm />
    </main>
  );
}
