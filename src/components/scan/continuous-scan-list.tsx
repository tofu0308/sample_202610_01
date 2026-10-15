"use client";

/**
 * 連続読取の待ちリスト（スクロール可）。
 * 登録 UI は items に寄せ、ここでは render props で差し込むだけにする。
 */

import type { ReactNode } from "react";
import { ScanEntryRow } from "@/components/scan/scan-entry-row";
import { ScanListEmpty } from "@/components/scan/scan-list-empty";
import { ScanResultsSection } from "@/components/scan/scan-results-section";
import type { FoundProduct } from "@/lib/items/register-item-request";
import type { ContinuousScanEntry } from "@/lib/scan/types";

type ContinuousScanListProps = {
  sectionId: string;
  entries: ContinuousScanEntry[];
  showEmptyList?: boolean;
  /** まとめて登録（例: RegisterItemsButton） */
  renderBulkRegister?: (products: FoundProduct[]) => ReactNode;
  /** 各行の登録（例: RegisterItemButton） */
  renderRegisterAction?: (product: FoundProduct) => ReactNode;
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
  renderBulkRegister,
  renderRegisterAction,
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
    <ScanResultsSection
      sectionId={sectionId}
      labelledBy="continuous-list-heading"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3
          id="continuous-list-heading"
          className="text-sm font-medium text-zinc-800"
        >
          読取リスト（{entries.length} 件・重複なし）
        </h3>
        {renderBulkRegister?.(foundProducts)}
      </div>
      <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
        {entries.map((entry) => {
          const found =
            entry.product?.found === true ? entry.product : null;
          return (
            <ScanEntryRow
              key={entry.id}
              code={entry.code}
              lookupStatus={entry.lookupStatus}
              lookupError={entry.lookupError}
              product={entry.product}
              registerAction={
                found && renderRegisterAction
                  ? renderRegisterAction(found)
                  : undefined
              }
            />
          );
        })}
      </ul>
    </ScanResultsSection>
  );
}
