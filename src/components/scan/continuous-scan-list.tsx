"use client";

/**
 * 連続読取の待ちリスト（スクロール可）。
 * 各行は JAN コピー＋登録。商品情報カードは出さない。
 */

import { RegisterItemsButton } from "@/components/items/register-items-button";
import { ScanEntryRow } from "@/components/scan/scan-entry-row";
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
          読取リスト（{entries.length} 件・JAN 重複なし）
        </h3>
        <RegisterItemsButton products={foundProducts} />
      </div>
      <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
        {entries.map((entry) => (
          <ScanEntryRow
            key={entry.id}
            code={entry.code}
            lookupStatus={entry.lookupStatus}
            lookupError={entry.lookupError}
            product={entry.product}
          />
        ))}
      </ul>
    </section>
  );
}
