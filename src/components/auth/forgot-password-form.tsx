"use client";

/**
 * パスワードリセット依頼（公開）。
 * resetPasswordForEmail でメールを送る。
 * リンクは /auth/callback?next=/update-password → 新パスワード画面。
 * 登録の有無は画面に出さない（Email 列挙を避ける）。
 */

import Link from "next/link";
import { useState, type FormEvent } from "react";
import {
  AUTH_LABEL_EMAIL,
  authFieldClassName,
  authFooterLinkClassName,
  authFormClassName,
  authInputClassName,
  authLabelClassName,
} from "@/components/auth/form-styles";
import { createClient } from "@/lib/supabase/client";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const trimmed = email.trim();
    if (!trimmed) {
      setError("Emailを入力してください");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      // 確認メールと同じ callback。next で新パスワード画面へ（U10）
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent("/update-password")}`;

      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        trimmed,
        { redirectTo },
      );

      if (resetError) {
        setError(resetError.message || "送信に失敗しました");
        setPending(false);
        return;
      }

      setSent(true);
      setPending(false);
    } catch {
      setError("送信処理でエラーが発生しました");
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-zinc-200">
          手続きを受け付けました（{email.trim() || "ご入力の Email"}）。
          登録済みの場合は、パスワード再設定用のメールが届きます。
        </p>
        <p className="text-sm leading-relaxed text-zinc-400">
          メールが来ない場合は迷惑メールフォルダも確認してください。リンクから新しいパスワードを設定できます。
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
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900 disabled:opacity-50"
      >
        {pending ? "送信中…" : "再設定メールを送る"}
      </button>
      <p className={authFooterLinkClassName}>
        <Link
          href="/login"
          className="font-medium text-zinc-100 underline underline-offset-2"
        >
          ログイン画面へ
        </Link>
      </p>
    </form>
  );
}
