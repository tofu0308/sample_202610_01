/**
 * 単体スキャン時のフッタ（読取結果・照会状況・結果を見る）。
 */

import type { ProductLookupResult, ScanResult } from "@/lib/scan/types";

type ScanOverlaySingleFooterProps = {
  starting: boolean;
  scanning: boolean;
  cameraError: string | null;
  result: ScanResult | null;
  product: ProductLookupResult | null;
  lookupPending: boolean;
  lookupError: string | null;
  onDismissToResults: () => void;
};

export function ScanOverlaySingleFooter({
  starting,
  scanning,
  cameraError,
  result,
  product,
  lookupPending,
  lookupError,
  onDismissToResults,
}: ScanOverlaySingleFooterProps) {
  const lookupDone =
    result !== null &&
    !lookupPending &&
    (product !== null || lookupError !== null);

  return (
    <footer className="shrink-0 space-y-2 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      {cameraError ? (
        <p className="text-sm text-red-300">{cameraError}</p>
      ) : null}

      {result ? (
        <div className="space-y-2 text-sm">
          <p className="font-medium text-emerald-300">読み取りました</p>
          <p className="break-all font-mono text-white">{result.rawValue}</p>
          <p className="text-zinc-400">
            {result.format ?? "不明"} /{" "}
            {new Date(result.scannedAt).toLocaleString("ja-JP")}
          </p>
          {lookupPending ? (
            <p className="text-zinc-400">照会中…</p>
          ) : null}
          {product?.found === true ? (
            <p className="text-white">{product.name}</p>
          ) : null}
          {product?.found === false ? (
            <p className="text-zinc-400">商品情報なし</p>
          ) : null}
          {lookupError ? (
            <p className="text-red-300">{lookupError}</p>
          ) : null}
          {lookupDone ? (
            <button
              type="button"
              onClick={onDismissToResults}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
            >
              結果を見る
            </button>
          ) : null}
        </div>
      ) : (
        <p className="text-sm text-zinc-400">
          {scanning
            ? "読取待機中…"
            : starting
              ? "しばらくお待ちください"
              : null}
        </p>
      )}
    </footer>
  );
}
