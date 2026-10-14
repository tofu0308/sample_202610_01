"use client";

/**
 * 新規登録フォーム（Email・パスワード・ユーザーID）。
 * この工程では入力検証まで。Supabase signUp の結線は次工程。
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
} from "@/components/auth/form-styles";
import {
  signupFormSchema,
  USERNAME_MAX_LENGTH,
} from "@/lib/auth/profile-schemas";

export function SignupForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [validatedMessage, setValidatedMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setValidatedMessage(null);

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

    // 次工程で signUp に渡す正規化済み値（いまは確認表示のみ）
    setValidatedMessage(
      `入力OK（ユーザーID: ${parsed.data.username}）。登録の送信は次の工程で接続します。`,
    );
    setPending(false);
  }

  return (
    <form onSubmit={handleSubmit} className={authFormClassName}>
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
          3〜20文字。英数字とアンダースコア。表示名と照合用（ログインには使いません）
        </span>
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      {validatedMessage ? (
        <p className="text-sm text-emerald-400">{validatedMessage}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900 disabled:opacity-50"
      >
        {pending ? "確認中…" : "入力を確認"}
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
