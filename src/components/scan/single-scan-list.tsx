"use client";

/**
 * 単体読取の結果行。連続リストと同じ ScanEntryRow で見た目を揃える。
 */

import { ScanEntryRow } from "@/components/scan/scan-entry-row";
import { ScanListEmpty } from "@/components/scan/scan-list-empty";
import type { ProductLookupResult, ScanResult } from "@/lib/scan/types";

type SingleScanListProps = {
  sectionId: string;
  result: ScanResult | null;
  product: ProductLookupResult | null;
  lookupPending: boolean;
  lookupError: string | null;
  showEmptyList?: boolean;
  onRegistered?: () => void;
};

export function SingleScanList({
  sectionId,
  result,
  product,
  lookupPending,
  lookupError,
  showEmptyList = false,
  onRegistered,
}: SingleScanListProps) {
  if (!result && !lookupPending) {
    if (showEmptyList) {
      return (
        <ScanListEmpty
          sectionId={sectionId}
          headingId="single-scan-list-heading"
          title="読取リスト"
        />
      );
    }
    return null;
  }

  const code = result?.rawValue ?? "";
  const lookupStatus = lookupPending
    ? "loading"
    : lookupError
      ? "error"
      : product
        ? "done"
        : undefined;

  return (
    <section
      id={sectionId}
      className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3"
      aria-live="polite"
      aria-labelledby="single-scan-list-heading"
    >
      <h3
        id="single-scan-list-heading"
        className="text-sm font-medium text-zinc-800"
      >
        読取リスト（1 件）
      </h3>
      <ul className="space-y-2 text-sm">
        <ScanEntryRow
          code={code || "—"}
          lookupStatus={lookupStatus}
          lookupError={lookupError}
          product={product}
          onRegistered={onRegistered}
        />
      </ul>
    </section>
  );
}
