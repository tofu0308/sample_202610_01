"use client";

/**
 * 一覧の 1 件分（Client Component）。
 * 表示 / 編集切替と削除。更新は PATCH、削除は DELETE を /api/notes/[id] に送る。
 */

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

type Note = {
  id: string;
  title: string;
  body: string | null;
};

type ApiErrorResponse = { error: string; details?: unknown };

type NoteListItemProps = {
  note: Note;
};

export function NoteListItem({ note }: NoteListItemProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body ?? "");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function resetForm() {
    setTitle(note.title);
    setBody(note.body ?? "");
    setError(null);
    setEditing(false);
  }

  async function handleUpdate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({
          title,
          body: body.trim() === "" ? "" : body,
        }),
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        setError(data.error || "ノートの更新に失敗しました");
        return;
      }

      setEditing(false);
      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setPending(false);
    }
  }

  async function handleDelete() {
    // 誤削除防止の最小確認（学習用）
    if (!window.confirm(`「${note.title}」を削除しますか？`)) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/notes/${note.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        setError(data.error || "ノートの削除に失敗しました");
        return;
      }

      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setPending(false);
    }
  }

  if (editing) {
    return (
      <li className="rounded-lg border border-zinc-200 px-4 py-3">
        <form onSubmit={handleUpdate} className="space-y-3">
          <div className="space-y-1">
            <label
              htmlFor={`edit-title-${note.id}`}
              className="block text-sm font-medium"
            >
              タイトル
            </label>
            <input
              id={`edit-title-${note.id}`}
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
            <label
              htmlFor={`edit-body-${note.id}`}
              className="block text-sm font-medium"
            >
              本文（任意）
            </label>
            <textarea
              id={`edit-body-${note.id}`}
              rows={3}
              maxLength={5000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              disabled={pending}
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
            />
          </div>
          {error ? <p className="text-sm text-red-600">{error}</p> : null}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={pending || title.trim() === ""}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pending ? "保存中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={pending}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm disabled:opacity-50"
            >
              キャンセル
            </button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="rounded-lg border border-zinc-200 px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h3 className="font-medium">{note.title}</h3>
          {note.body ? (
            <p className="mt-1 whitespace-pre-wrap text-zinc-600">
              {note.body}
            </p>
          ) : null}
        </div>
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            onClick={() => {
              setTitle(note.title);
              setBody(note.body ?? "");
              setError(null);
              setEditing(true);
            }}
            disabled={pending}
            className="rounded-md border border-zinc-300 px-2.5 py-1 text-sm disabled:opacity-50"
          >
            編集
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={pending}
            className="rounded-md border border-red-200 px-2.5 py-1 text-sm text-red-700 disabled:opacity-50"
          >
            削除
          </button>
        </div>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </li>
  );
}
