/**
 * 連続スキャン時のフッタ（重複通知・直近 JAN・読取終了）。
 */

import type { ContinuousScanEntry } from "@/lib/scan/types";

type ScanOverlayContinuousFooterProps = {
  starting: boolean;
  scanning: boolean;
  cameraError: string | null;
  duplicateNotice: string | null;
  latestEntry: ContinuousScanEntry | null;
  continuousLookupActive: boolean;
  entryCount: number;
  onFinish: () => void;
};

function latestEntryLabel(entry: ContinuousScanEntry): string {
  if (entry.product?.found === true) {
    return ` — ${entry.product.name}`;
  }
  if (
    entry.lookupStatus === "loading" ||
    entry.lookupStatus === "pending"
  ) {
    return " …";
  }
  if (entry.product?.found === false) {
    return " — 商品なし";
  }
  if (entry.lookupError) {
    return " — エラー";
  }
  return "";
}

export function ScanOverlayContinuousFooter({
  starting,
  scanning,
  cameraError,
  duplicateNotice,
  latestEntry,
  continuousLookupActive,
  entryCount,
  onFinish,
}: ScanOverlayContinuousFooterProps) {
  return (
    <footer className="shrink-0 space-y-2 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {cameraError ? (
        <p className="text-sm text-red-300">{cameraError}</p>
      ) : null}

      <div className="space-y-2 text-sm">
        {duplicateNotice ? (
          <p
            className="rounded bg-amber-500/20 px-2 py-1.5 text-amber-100"
            role="status"
          >
            {duplicateNotice}
          </p>
        ) : (
          <p className="text-zinc-400">
            {starting
              ? "しばらくお待ちください"
              : scanning
                ? "読取待機中…重複したJANコードは登録しません"
                : null}
          </p>
        )}
        {latestEntry ? (
          <p className="truncate rounded bg-white/10 px-2 py-1.5 font-mono text-xs text-white">
            直近: {latestEntry.code}
            {latestEntryLabel(latestEntry)}
            {continuousLookupActive ? "（照会中）" : ""}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onFinish}
          className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
        >
          読取を終了（{entryCount} 件）
        </button>
      </div>
    </footer>
  );
}
