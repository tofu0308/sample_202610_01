/**
 * 全画面スキャナ（portal 先の中身）。連続時は件数＋直近のみでカメラ領域を確保する。
 */

import type { ContinuousScanEntry, ProductLookupResult, ScanResult } from "@/lib/scan/types";

type ScanOverlayProps = {
  isContinuous: boolean;
  regionId: string;
  scanning: boolean;
  starting: boolean;
  cameraError: string | null;
  result: ScanResult | null;
  product: ProductLookupResult | null;
  lookupPending: boolean;
  lookupError: string | null;
  continuousEntries: ContinuousScanEntry[];
  latestContinuousEntry: ContinuousScanEntry | null;
  duplicateNotice: string | null;
  continuousLookupActive: boolean;
  onCancel: () => void;
  onFinishContinuous: () => void;
  onDismissToResults: () => void;
};

export function ScanOverlay({
  isContinuous,
  regionId,
  scanning,
  starting,
  cameraError,
  result,
  product,
  lookupPending,
  lookupError,
  continuousEntries,
  latestContinuousEntry,
  duplicateNotice,
  continuousLookupActive,
  onCancel,
  onFinishContinuous,
  onDismissToResults,
}: ScanOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={isContinuous ? "連続バーコードスキャン" : "バーコードスキャン"}
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
        <p className="text-sm font-medium">
          {starting
            ? "カメラ起動中…"
            : isContinuous
              ? `連続読取（${continuousEntries.length} 件）`
              : result
                ? lookupPending
                  ? "商品を調べています…"
                  : "読み取り完了"
                : "コードを枠に合わせてください"}
        </p>
        <button
          type="button"
          onClick={() => {
            if (isContinuous) {
              onFinishContinuous();
            } else {
              onCancel();
            }
          }}
          className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
        >
          {isContinuous ? "完了" : "キャンセル"}
        </button>
      </header>

      <div
        id={regionId}
        className="min-h-0 flex-1 basis-0 overflow-hidden [&_img]:mx-auto [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />

      <footer className="shrink-0 space-y-2 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {cameraError ? (
          <p className="text-sm text-red-300">{cameraError}</p>
        ) : null}

        {isContinuous ? (
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
                    ? "読み取り待機中…同じ JAN は追加しません"
                    : null}
              </p>
            )}
            {latestContinuousEntry ? (
              <p className="truncate rounded bg-white/10 px-2 py-1.5 font-mono text-xs text-white">
                直近: {latestContinuousEntry.code}
                {latestContinuousEntry.product?.found === true
                  ? ` — ${latestContinuousEntry.product.name}`
                  : latestContinuousEntry.lookupStatus === "loading" ||
                      latestContinuousEntry.lookupStatus === "pending"
                    ? " …"
                    : latestContinuousEntry.product?.found === false
                      ? " — 商品なし"
                      : latestContinuousEntry.lookupError
                        ? " — エラー"
                        : ""}
                {continuousLookupActive ? "（照会中）" : ""}
              </p>
            ) : null}
            <button
              type="button"
              onClick={onFinishContinuous}
              className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
            >
              読取を終了（{continuousEntries.length} 件）
            </button>
          </div>
        ) : result ? (
          <div className="space-y-1 text-sm">
            <p className="font-medium text-emerald-300">読み取りました</p>
            <p className="break-all font-mono text-white">{result.rawValue}</p>
            <p className="text-zinc-400">
              {result.format ?? "不明"} /{" "}
              {new Date(result.scannedAt).toLocaleString("ja-JP")}
            </p>
            {lookupPending ? (
              <p className="text-zinc-400">商品検索中…</p>
            ) : null}
            {product?.found === true ? (
              <p className="text-white">{product.name}</p>
            ) : null}
            {product?.found === false ? (
              <div className="space-y-2">
                <p className="text-zinc-400">商品情報なし</p>
                <button
                  type="button"
                  onClick={onDismissToResults}
                  className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
                >
                  結果を見る
                </button>
              </div>
            ) : null}
            {lookupError ? (
              <button
                type="button"
                onClick={onDismissToResults}
                className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
              >
                閉じる
              </button>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-zinc-400">
            {scanning
              ? "読み取り待機中…"
              : starting
                ? "しばらくお待ちください"
                : null}
          </p>
        )}
      </footer>
    </div>
  );
}
