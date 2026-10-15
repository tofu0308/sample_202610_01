/**
 * 読取リストの外枠（単体／連続で共通）。
 * 見出しまわりだけ呼び出し側で差し替える。
 */

import type { ReactNode } from "react";

type ScanResultsSectionProps = {
  sectionId: string;
  labelledBy: string;
  children: ReactNode;
};

export function ScanResultsSection({
  sectionId,
  labelledBy,
  children,
}: ScanResultsSectionProps) {
  return (
    <section
      id={sectionId}
      className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3"
      aria-live="polite"
      aria-labelledby={labelledBy}
    >
      {children}
    </section>
  );
}
