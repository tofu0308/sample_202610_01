"use client";

/**
 * 連続読取の待ちリスト（スクロール可）。
 * 各行はサムネ・商品名・JANコードコピー・登録。
 */

import { RegisterItemsButton } from "@/components/items/register-items-button";
import { ScanEntryRow } from "@/components/scan/scan-entry-row";
import { ScanListEmpty } from "@/components/scan/scan-list-empty";
import type { FoundProduct } from "@/lib/items/register-item-request";
import type { ContinuousScanEntry } from "@/lib/scan/types";

type ContinuousScanListProps = {
  sectionId: string;
  entries: ContinuousScanEntry[];
  showEmptyList?: boolean;
  onRegistered?: () => void;
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
  showEmptyList = false,
  onRegistered,
}: ContinuousScanListProps) {
  if (entries.length === 0) {
    if (showEmptyList) {
      return (
        <ScanListEmpty
          sectionId={sectionId}
          headingId="continuous-list-heading"
          title="読取リスト"
        />
      );
    }
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
          読取リスト（{entries.length} 件・重複なし）
        </h3>
        <RegisterItemsButton
          products={foundProducts}
          onRegistered={onRegistered}
        />
      </div>
      <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
        {entries.map((entry) => (
          <ScanEntryRow
            key={entry.id}
            code={entry.code}
            lookupStatus={entry.lookupStatus}
            lookupError={entry.lookupError}
            product={entry.product}
            onRegistered={onRegistered}
          />
        ))}
      </ul>
    </section>
  );
}
