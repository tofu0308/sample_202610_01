"use client";

/**
 * Email／パスワードでログイン。成功後は nextPath へ。
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AUTH_LABEL_EMAIL,
  AUTH_LABEL_PASSWORD,
  authFieldClassName,
  authFooterLinkClassName,
  authFormClassName,
  authInputClassName,
  authLabelClassName,
} from "@/components/auth/form-styles";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  nextPath: string;
  initialError: string | null;
};

export function LoginForm({ nextPath, initialError }: LoginFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message || "ログインに失敗しました");
        setPending(false);
        return;
      }

      router.replace(nextPath);
      router.refresh();
    } catch {
      setError("ログイン処理でエラーが発生しました");
      setPending(false);
    }
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
          autoComplete="username"
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className={authInputClassName}
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900 disabled:opacity-50"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>
      <p className={authFooterLinkClassName}>
        アカウントがない場合は{" "}
        <Link
          href="/signup"
          className="font-medium text-zinc-100 underline underline-offset-2"
        >
          新規登録
        </Link>
      </p>
    </form>
  );
}
