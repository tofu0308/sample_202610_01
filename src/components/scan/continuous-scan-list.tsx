"use client";

/**
 * 連続読取の待ちリスト（スクロール可・商品画像付き）。
 * 照会成功分は「まとめて登録」。個別登録も残す。
 */

import { RegisterItemButton } from "@/components/items/register-item-button";
import { RegisterItemsButton } from "@/components/items/register-items-button";
import type { FoundProduct } from "@/lib/items/register-item-request";
import type { ContinuousScanEntry } from "@/lib/scan/types";

type ContinuousScanListProps = {
  sectionId: string;
  entries: ContinuousScanEntry[];
};

function collectFoundProducts(entries: ContinuousScanEntry[]): FoundProduct[] {
  const products: FoundProduct[] = [];
  for (const entry of entries) {
    if (entry.product?.found === true) {
      products.push(entry.product);
    }
  }
  return products;
}

export function ContinuousScanList({
  sectionId,
  entries,
}: ContinuousScanListProps) {
  if (entries.length === 0) {
    return null;
  }

  const foundProducts = collectFoundProducts(entries);

  return (
    <section
      id={sectionId}
      className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3"
      aria-live="polite"
      aria-labelledby="continuous-list-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id="continuous-list-heading"
          className="text-sm font-medium text-zinc-800"
        >
          連続読取リスト（{entries.length} 件・JAN 重複なし）
        </h3>
        <RegisterItemsButton products={foundProducts} />
      </div>
      {foundProducts.length === 0 ? (
        <p className="text-xs text-zinc-500">
          商品情報が出た行からまとめて登録できます。
        </p>
      ) : null}
      <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded border border-zinc-200 bg-white px-3 py-2"
          >
            {entry.product?.found === true ? (
              <div className="space-y-1">
                <div className="flex gap-3">
                  {entry.product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
                    <img
                      src={entry.product.imageUrl}
                      alt=""
                      width={56}
                      height={56}
                      className="h-14 w-14 shrink-0 rounded border border-zinc-200 object-cover"
                    />
                  ) : (
                    <div
                      className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400"
                      aria-hidden
                    >
                      画像なし
                    </div>
                  )}
                  <div className="min-w-0 space-y-0.5">
                    <p className="font-mono text-xs text-zinc-500">
                      {entry.code}
                    </p>
                    <p className="font-medium text-zinc-800">
                      {entry.product.name}
                    </p>
                    {entry.product.brandName ? (
                      <p className="text-xs text-zinc-500">
                        {entry.product.brandName}
                      </p>
                    ) : null}
                  </div>
                </div>
                <RegisterItemButton product={entry.product} compact />
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="font-mono text-xs text-zinc-600">{entry.code}</p>
                {entry.lookupStatus === "loading" ||
                entry.lookupStatus === "pending" ? (
                  <p className="text-zinc-500">商品検索中…</p>
                ) : null}
                {entry.lookupError ? (
                  <p className="text-red-600">{entry.lookupError}</p>
                ) : null}
                {entry.product?.found === false ? (
                  <p className="text-zinc-500">商品情報なし</p>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
