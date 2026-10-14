"use client";

/**
 * 新パスワード設定（recovery セッション中に使う）。
 * updateUser でパスワードを更新し、完了後はトップへ。
 */

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import {
  AUTH_LABEL_PASSWORD,
  authFieldClassName,
  authFormClassName,
  authHintClassName,
  authInputClassName,
  authLabelClassName,
} from "@/components/auth/form-styles";
import { updatePasswordFormSchema } from "@/lib/auth/profile-schemas";
import { createClient } from "@/lib/supabase/client";

export function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);

    const parsed = updatePasswordFormSchema.safeParse({
      password,
      confirmPassword,
    });

    if (!parsed.success) {
      const first = parsed.error.issues[0];
      setError(first?.message ?? "入力内容を確認してください");
      setPending(false);
      return;
    }

    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({
        password: parsed.data.password,
      });

      if (updateError) {
        setError(updateError.message || "パスワードの更新に失敗しました");
        setPending(false);
        return;
      }

      router.replace("/");
      router.refresh();
    } catch {
      setError("パスワード更新でエラーが発生しました");
      setPending(false);
    }
  }

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={authFormClassName}
    >
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
        <span className={authHintClassName}>6文字以上</span>
      </label>
      <label className={authFieldClassName}>
        <span className={authLabelClassName}>パスワード（確認）</span>
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className={authInputClassName}
        />
      </label>
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900 disabled:opacity-50"
      >
        {pending ? "更新中…" : "パスワードを更新する"}
      </button>
    </form>
  );
}
