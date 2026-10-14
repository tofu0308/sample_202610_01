"use client";

/**
 * ルートセグメントの例外用（React Error Boundary）。
 * - 想定内の操作失敗 … 各画面インライン（ここには来ない）
 * - throwAppError … 意図的にここへ（不正操作など）
 * - その他の未処理 throw … 想定外として同じ画面
 */

import Link from "next/link";
import { useEffect } from "react";
import { getAppErrorPresentation } from "@/lib/errors/app-error";

type ErrorPageProps = {
  error: Error & { digest?: string };
  reset: () => void;
  /** Next 16.3+。再 fetch 付きの再試行。無い環境では reset にフォールバック */
  retry?: () => void;
};

export default function ErrorPage({ error, reset, retry }: ErrorPageProps) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const onRetry = retry ?? reset;
  const { intentional, title, description } = getAppErrorPresentation(error);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-6 py-16">
      <header className="space-y-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-zinc-300">{description}</p>
        {error.digest ? (
          <p className="font-mono text-xs text-zinc-500">
            参照 ID: {error.digest}
          </p>
        ) : null}
      </header>
      <div className="flex flex-col gap-3 sm:flex-row">
        {!intentional ? (
          <button
            type="button"
            onClick={onRetry}
            className="rounded-md bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900"
          >
            もう一度試す
          </button>
        ) : null}
        <Link
          href="/"
          className={
            intentional
              ? "rounded-md bg-zinc-100 px-3 py-2.5 text-center text-sm font-medium text-zinc-900"
              : "rounded-md border border-zinc-500 px-3 py-2.5 text-center text-sm font-medium text-zinc-100 hover:bg-zinc-900"
          }
        >
          登録一覧へ
        </Link>
      </div>
    </main>
  );
}
