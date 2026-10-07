"use client";

/**
 * Note 作成フォーム（Client Component）。
 * 既存の POST /api/notes をブラウザから呼び、文字化けしにくい UTF-8 経路で作成する。
 * 成功後は router.refresh() で Server Component の一覧を再取得する。
 */

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

/** API の成功 / 失敗レスポンス（必要最低限だけ型付け） */
type CreateNoteResponse =
  | { note: { id: string } }
  | { error: string; details?: unknown };

export function NoteCreateForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      // charset=utf-8 を明示（Windows ターミナル経由の curl で起きた文字化けを避ける）
      const response = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          title,
          // 空文字は送らず optional 扱いにする（API 側 zod と揃える）
          body: body.trim() === "" ? undefined : body,
        }),
      });

      const data = (await response.json()) as CreateNoteResponse;

      if (!response.ok) {
        const message =
          "error" in data ? data.error : "ノートの作成に失敗しました";
        setError(message);
        return;
      }

      setTitle("");
      setBody("");
      // 一覧は Server Component 側で取得しているため、再レンダーを促す
      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="note-title" className="block text-sm font-medium">
          タイトル
        </label>
        <input
          id="note-title"
          name="title"
          type="text"
          required
          maxLength={200}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          disabled={pending}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      <div className="space-y-1">
        <label htmlFor="note-body" className="block text-sm font-medium">
          本文（任意）
        </label>
        <textarea
          id="note-body"
          name="body"
          rows={4}
          maxLength={5000}
          value={body}
          onChange={(event) => setBody(event.target.value)}
          disabled={pending}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
        />
      </div>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={pending || title.trim() === ""}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? "作成中…" : "ノートを作成"}
      </button>
    </form>
  );
}
