/**
 * トップページ（Server Component）。
 * Note 一覧はサーバで Prisma 取得。作成・編集・削除とバーコード読取は Client に分離する。
 */

import { BarcodeScanner } from "@/components/barcode-scanner";
import { NoteCreateForm } from "@/components/note-create-form";
import { NoteListItem } from "@/components/note-list-item";
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
          Prisma + Supabase 学習用。CRUD は{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            /api/notes
          </code>
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="scan-heading">
        <h2 id="scan-heading" className="text-lg font-medium">
          スキャン
        </h2>
        <BarcodeScanner />
      </section>

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
              <NoteListItem
                key={note.id}
                note={{
                  id: note.id,
                  title: note.title,
                  body: note.body,
                }}
              />
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
