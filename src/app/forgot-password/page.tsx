/**
 * パスワード再設定の依頼画面（公開）。
 * メール送信のみ。リンク先の新パスワード入力は後続工程。
 */

import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { authPageDescClassName } from "@/components/auth/form-styles";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          パスワード再設定
        </h1>
        <p className={authPageDescClassName}>
          登録した Email を入力してください。再設定用のリンクを送ります。
        </p>
      </header>
      <ForgotPasswordForm />
    </main>
  );
}
