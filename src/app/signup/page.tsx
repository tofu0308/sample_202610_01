/**
 * 新規登録画面（公開）。
 * signUp 後は確認メール待ち。Profile 作成は後続工程。
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
          メール・パスワード・ユーザーIDを入力してください。はじめての登録では確認用のメールが届きます。すでに登録済みの場合はログインへ進んでください。
        </p>
      </header>
      <SignupForm />
    </main>
  );
}
