"use client";

/**
 * 新規登録フォーム（メール・パスワード・ユーザーID）。
 * Supabase signUp で確認メールを送り、username は user_metadata に載せる。
 * Profile 行の作成は後続工程。
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AUTH_LABEL_EMAIL,
  AUTH_LABEL_PASSWORD,
  AUTH_LABEL_USERNAME,
  authFieldClassName,
  authFooterLinkClassName,
  authFormClassName,
  authHintClassName,
  authInputClassName,
  authLabelClassName,
  authPrimarySubmitClassName,
} from "@/components/auth/form-styles";
import {
  signupFormSchema,
  USERNAME_MAX_LENGTH,
} from "@/lib/auth/profile-schemas";
import { createClient } from "@/lib/supabase/client";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const parsed = signupFormSchema.safeParse({
      email,
      password,
      username,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "入力内容を確認してください");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;

      const { error: signUpError } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          // 確認完了後に Profile へ写す想定（次々工程）
          data: { username: parsed.data.username },
          emailRedirectTo,
        },
      });

      if (signUpError) {
        setError(signUpError.message || "登録に失敗しました");
        setPending(false);
        return;
      }

      setPendingConfirm(true);
      setPending(false);
    } catch {
      setError("登録処理でエラーが発生しました");
      setPending(false);
    }
  }

  if (pendingConfirm) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-200">
          手続きを受け付けました（{email.trim() || "ご入力のメール"}）。
          はじめての登録であれば、確認用メールのリンクから完了できます。
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          メールが来ない場合は迷惑メールフォルダも確認してください。すでに登録済みの場合は、こちらから再操作しても確認メールは再送されないことがあります。ログインをお試しください。
        </p>
        <p className={authFooterLinkClassName}>
          <Link
            href="/login"
            className="font-medium text-zinc-100 underline underline-offset-2"
          >
            ログイン画面へ
          </Link>
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={authFormClassName}
    >
      <label className={authFieldClassName}>
        <span className={authLabelClassName}>{AUTH_LABEL_EMAIL}</span>
        <input
          type="email"
          name="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className={authInputClassName}
        />
      </label>
      <label className={authFieldClassName}>
        <span className={authLabelClassName}>{AUTH_LABEL_PASSWORD}</span>
        <input
          type="password"
          name="password"
          autoComplete="new-password"
          required
          minLength={6}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authInputClassName}
        />
      </label>
      <label className={authFieldClassName}>
        <span className={authLabelClassName}>{AUTH_LABEL_USERNAME}</span>
        <input
          type="text"
          name="username"
          autoComplete="username"
          required
          maxLength={USERNAME_MAX_LENGTH}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          className={authInputClassName}
        />
        <span className={authHintClassName}>
          3〜20文字。英数字とアンダースコア。画面表示と照合用（ログインには使いません）
        </span>
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className={authPrimarySubmitClassName}
      >
        {pending ? "登録中…" : "登録する"}
      </button>
      <p className={authFooterLinkClassName}>
        すでにアカウントがある場合は{" "}
        <Link
          href="/login"
          className="font-medium text-zinc-100 underline underline-offset-2"
        >
          ログイン
        </Link>
      </p>
    </form>
  );
}
