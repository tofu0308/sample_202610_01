import { prisma } from "@/lib/prisma";

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
          Prisma + Supabase の接続確認用。API は{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            /api/notes
          </code>
        </p>
      </header>

      {notes.length === 0 ? (
        <p className="text-zinc-500">まだノートはありません。</p>
      ) : (
        <ul className="space-y-4">
          {notes.map((note) => (
            <li
              key={note.id}
              className="rounded-lg border border-zinc-200 px-4 py-3"
            >
              <h2 className="font-medium">{note.title}</h2>
              {note.body ? (
                <p className="mt-1 whitespace-pre-wrap text-zinc-600">
                  {note.body}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
