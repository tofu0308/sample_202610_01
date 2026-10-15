/**
 * 新規登録画面（公開）。
 * signUp 後は確認メール待ち。Profile 作成は後続工程。
 */

import { AuthPageHeader } from "@/components/auth/auth-page-header";
import { SignupForm } from "@/components/auth/signup-form";

export default function SignupPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <AuthPageHeader
        title="新規登録"
        description="メール・パスワード・ユーザーIDを入力してください。はじめての登録では確認用のメールが届きます。すでに登録済みの場合はログインへ進んでください。"
      />
      <SignupForm />
    </main>
  );
}
