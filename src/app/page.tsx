/**
 * トップページ（Server Component）。
 * 登録一覧はサーバで Prisma 取得。バーコード読取は Client。
 * 旧 Note の手動作成フォームは非表示（スキャンからの登録に寄せる）。
 */

import { ItemListItem } from "@/components/items/item-list-item";
import { NoteListItem } from "@/components/notes/note-list-item";
import { BarcodeScanner } from "@/components/scan/barcode-scanner";
// import { NoteCreateForm } from "@/components/notes/note-create-form";
import { DEV_USER_ID } from "@/lib/items/constants";
import { prisma } from "@/lib/prisma";

// 一覧を毎回 DB から取り直す（キャッシュで古くならないようにする）
export const dynamic = "force-dynamic";

export default async function Home() {
  // TODO: ログイン機能を入れたら、ログイン中のユーザー ID で絞り込む
  const [items, notes] = await Promise.all([
    prisma.userItem.findMany({
      where: { userId: DEV_USER_ID },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    }),
    prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-2xl flex-col gap-8 px-6 py-16">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">登録一覧</h1>
        <p className="text-zinc-600">
          バーコードで調べた商品を DB に登録する学習用アプリ。API は{" "}
          <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
            /api/items
          </code>
        </p>
      </header>

      <section className="space-y-3" aria-labelledby="scan-heading">
        <h2 id="scan-heading" className="text-lg font-medium">
          スキャン / 登録
        </h2>
        <BarcodeScanner />
      </section>

      <section className="space-y-3" aria-labelledby="item-list-heading">
        <h2 id="item-list-heading" className="text-lg font-medium">
          登録
        </h2>
        {items.length === 0 ? (
          <p className="text-zinc-500">
            商品を調べて登録すると一覧に表示されます。
          </p>
        ) : (
          <ul className="space-y-4">
            {items.map((item) => (
              <ItemListItem
                key={item.id}
                item={{
                  id: item.id,
                  note: item.note,
                  status1: item.status1,
                  product: {
                    jan: item.product.jan,
                    name: item.product.name,
                    brandName: item.product.brandName,
                    imageUrl: item.product.imageUrl,
                  },
                }}
              />
            ))}
          </ul>
        )}
      </section>

      {/* Note 作成フォームは非表示（コードと API は残してある）
      <section className="space-y-3" aria-labelledby="create-note-heading">
        <h2 id="create-note-heading" className="text-lg font-medium">
          新規作成
        </h2>
        <NoteCreateForm />
      </section>
      */}

      <section className="space-y-3" aria-labelledby="note-list-heading">
        <h2 id="note-list-heading" className="text-lg font-medium">
          Notes（以前の練習用。あとで外してよい）
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
