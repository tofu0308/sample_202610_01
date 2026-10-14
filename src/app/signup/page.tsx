/**
 * 新規登録画面（公開）。
 * フォームの Auth 送信は後続工程。ここでは入力 UI と検証まで。
 */

import { SignupForm } from "@/components/auth/signup-form";
import { authPageDescClassName } from "@/components/auth/form-styles";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          新規登録
        </h1>
        <p className={authPageDescClassName}>
          Email・パスワード・ユーザーIDを入力してください。確認メールの手順は登録送信の工程でつなぎます。
        </p>
      </header>
      <SignupForm />
    </main>
  );
}
