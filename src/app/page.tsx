/**
 * トップページ（Server Component）。
 * Note 一覧はサーバで Prisma 取得。作成フォームだけ Client Component に分離する。
 */

import { NoteCreateForm } from "@/components/note-create-form";
import { prisma } from "@/lib/prisma";

// 一覧を毎回最新にする（学習用。本番ではキャッシュ戦略を別途検討）
export const dynamic = "force-dynamic";

export default async function Home() {
  const notes = await prisma.note.findMany({
    orderBy: { createdAt: "desc" },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Notes</h1>
        <p className="text-zinc-600">
          Prisma + Supabase 学習用。作成はフォーム →{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            POST /api/notes
          </code>
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="create-note-heading">
        <h2 id="create-note-heading" className="text-lg font-medium">
          新規作成
        </h2>
        <NoteCreateForm />
      </section>

      <section className="space-y-3" aria-labelledby="note-list-heading">
        <h2 id="note-list-heading" className="text-lg font-medium">
          一覧
        </h2>
        {notes.length === 0 ? (
          <p className="text-zinc-500">まだノートはありません。</p>
        ) : (
          <ul className="space-y-4">
            {notes.map((note) => (
              <li
                key={note.id}
                className="rounded-lg border border-zinc-200 px-4 py-3"
              >
                <h3 className="font-medium">{note.title}</h3>
                {note.body ? (
                  <p className="mt-1 whitespace-pre-wrap text-zinc-600">
                    {note.body}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
