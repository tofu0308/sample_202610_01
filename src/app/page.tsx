/**
 * トップページ（Server Component）。
 * 登録一覧はサーバで Prisma 取得（ログイン中ユーザーのみ）。バーコード読取は Client。
 */

import { LogoutButton } from "@/components/auth/logout-button";
import { ItemsTable } from "@/components/items/items-table";
import { BarcodeScanner } from "@/components/scan/barcode-scanner";
import { requireUserForPage } from "@/lib/auth/require-user";
import { prisma } from "@/lib/prisma";

// 一覧を毎回 DB から取り直す（キャッシュで古くならないようにする）
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUserForPage();

  const items = await prisma.userItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-16">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">登録一覧</h1>
          <p className="text-zinc-600">
            バーコードで調べた商品を DB に登録する学習用アプリ。API は{" "}
            <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-sm">
              /api/items
            </code>
          </p>
          {user.email ? (
            <p className="text-xs text-zinc-500">ログイン中: {user.email}</p>
          ) : null}
        </div>
        <LogoutButton />
      </header>

      <section className="space-y-3" aria-labelledby="scan-heading">
        <h2 id="scan-heading" className="text-lg font-medium">
          スキャン / 登録
        </h2>
        <BarcodeScanner />
      </section>

      <section className="space-y-3" aria-labelledby="item-list-heading">
        <h2 id="item-list-heading" className="text-lg font-medium">
          登録（{items.length} 件）
        </h2>
        {items.length === 0 ? (
          <p className="text-zinc-500">
            商品を調べて登録すると一覧に表示されます。以前
            local-dev-user で登録したデータがある場合は、Auth uid
            へ付け替える必要があります（学習メモ参照）。
          </p>
        ) : (
          <ItemsTable
            items={items.map((item) => ({
              id: item.id,
              note: item.note,
              status1: item.status1,
              createdAt: item.createdAt.toISOString(),
              updatedAt: item.updatedAt.toISOString(),
              product: {
                jan: item.product.jan,
                name: item.product.name,
                brandName: item.product.brandName,
                imageUrl: item.product.imageUrl,
              },
            }))}
          />
        )}
      </section>
    </main>
  );
}
