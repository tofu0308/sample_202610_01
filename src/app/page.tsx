/**
 * トップページ（Server Component）。
 * 登録一覧はサーバで Prisma 取得（ログイン中ユーザーのみ）。バーコード読取は Client。
 */

import { LogoutButton } from "@/components/auth/logout-button";
import { ItemsTable } from "@/components/items/items-table";
import { BarcodeScanner } from "@/components/scan/barcode-scanner";
import { APP_NAME } from "@/lib/app-name";
import { requireUserForPage } from "@/lib/auth/require-user";
import { formatItemCountLabel } from "@/lib/items/item-limit-view";
import { toItemsTableRow } from "@/lib/items/to-items-table-row";
import {
  getUserItemLimit,
  isUserItemLimitExempt,
} from "@/lib/items/user-item-limit";
import { prisma } from "@/lib/prisma";

// 一覧を毎回 DB から取り直す（キャッシュで古くならないようにする）
export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await requireUserForPage();

  // DB 障害などは catch せず error.tsx へ（想定外のページ失敗）
  const items = await prisma.userItem.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    include: { product: true },
  });

  const itemLimit = {
    currentCount: items.length,
    limit: getUserItemLimit(),
    unlimited: isUserItemLimitExempt(user.email),
    ownedJans: items.map((item) => item.product.jan),
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-8 px-6 py-8 md:py-16">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
            {APP_NAME}
          </h1>
          <p className="text-zinc-400">
            バーコードで商品をスキャンし、所持状況・残量を管理できます。また、メモを残すことができます。
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {/* Profile 必須が正。無い既存管理者はメールにフォールバック（設計書 §13.3） */}
          <p className="text-sm text-zinc-400">
            {user.username
              ? `${user.username} さん`
              : user.email
                ? user.email
                : null}
          </p>
          <LogoutButton />
        </div>
      </header>

      <section className="space-y-3" aria-labelledby="scan-heading">
        <h2 id="scan-heading" className="text-lg font-medium text-zinc-100">
          スキャン / 登録
        </h2>
        <BarcodeScanner itemLimit={itemLimit} />
      </section>

      <section
        id="items"
        className="space-y-3"
        aria-labelledby="item-list-heading"
      >
        <h2
          id="item-list-heading"
          className="text-lg font-medium text-zinc-100"
        >
          登録一覧（{formatItemCountLabel(itemLimit)}）
        </h2>
        {items.length === 0 ? (
          <p className="text-zinc-400">
            スキャンまたは手動入力で照会し、登録するとここに表示されます。
          </p>
        ) : (
          <ItemsTable items={items.map(toItemsTableRow)} />
        )}
      </section>
    </main>
  );
}
