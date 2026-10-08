"use client";

/**
 * メール／パスワードでログイン。成功後は nextPath へ。
 */

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
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
    <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-800">メール</span>
        <input
          type="email"
          name="email"
          autoComplete="username"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 md:text-sm"
        />
      </label>
      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-800">パスワード</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-md border border-zinc-300 px-3 py-2 text-base outline-none focus:border-zinc-500 md:text-sm"
        />
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "ログイン中…" : "ログイン"}
      </button>
    </form>
  );
}
