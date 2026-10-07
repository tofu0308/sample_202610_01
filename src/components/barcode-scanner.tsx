"use client";

/**
 * QR / バーコード読み取り UI（Client Component）。
 * カメラ・照会・オーバーレイの状態は useBarcodeScanFlow に寄せ、ここは表示に集中する。
 * PC（md 以上）ではセクションごと非表示。
 */

import { createPortal } from "react-dom";
import { useBarcodeScanFlow } from "@/hooks/use-barcode-scan-flow";

export type { ScanResult } from "@/lib/scan/types";

export function BarcodeScanner() {
  const {
    productLookupSectionId,
    regionId,
    overlayOpen,
    scanning,
    starting,
    cameraError,
    result,
    product,
    lookupPending,
    lookupError,
    manualValue,
    setManualValue,
    copied,
    startScan,
    cancelOverlay,
    dismissOverlayToResults,
    handleManualSubmit,
    handleCopy,
  } = useBarcodeScanFlow();

  return (
    <div id="scan" className="space-y-4 md:hidden">
      <p className="text-sm text-zinc-600">
        「スキャン開始」を押すと画面全体でカメラが開きます。カメラ許可が必要です（HTTPS
        推奨）。
      </p>

      <button
        type="button"
        onClick={() => void startScan()}
        disabled={overlayOpen || starting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {starting ? "起動中…" : "スキャン開始"}
      </button>

      {cameraError && !overlayOpen ? (
        <p className="text-sm text-red-600">{cameraError}</p>
      ) : null}

      <section
        className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3"
        aria-live="polite"
        aria-labelledby="scan-result-heading"
      >
        <h3 id="scan-result-heading" className="text-sm font-medium text-zinc-800">
          読取結果
        </h3>
        {result ? (
          <dl className="space-y-1 text-sm text-zinc-700">
            <div>
              <dt className="inline font-medium">値: </dt>
              <dd className="inline break-all font-mono">{result.rawValue}</dd>
            </div>
            <div>
              <dt className="inline font-medium">形式: </dt>
              <dd className="inline">{result.format ?? "不明"}</dd>
            </div>
            <div>
              <dt className="inline font-medium">時刻: </dt>
              <dd className="inline">
                {new Date(result.scannedAt).toLocaleString("ja-JP")}
              </dd>
            </div>
          </dl>
        ) : (
          <p className="text-sm text-zinc-500">まだ読み取っていません。</p>
        )}
        {result ? (
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900"
          >
            {copied ? "コピーしました" : "値をコピー"}
          </button>
        ) : null}
      </section>

      <section
        id={productLookupSectionId}
        className="space-y-2 rounded-md border border-zinc-200 bg-white px-4 py-3"
        aria-live="polite"
        aria-labelledby="product-lookup-heading"
      >
        <h3
          id="product-lookup-heading"
          className="text-sm font-medium text-zinc-800"
        >
          商品情報
        </h3>
        {lookupPending ? (
          <p className="text-sm text-zinc-500">Yahoo!ショッピングで検索中…</p>
        ) : null}
        {lookupError ? (
          <p className="text-sm text-red-600">{lookupError}</p>
        ) : null}
        {!lookupPending && !lookupError && product?.found === true ? (
          <div className="flex gap-3 text-sm text-zinc-700">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
              <img
                src={product.imageUrl}
                alt=""
                width={64}
                height={64}
                className="h-16 w-16 shrink-0 rounded border border-zinc-200 object-cover"
              />
            ) : null}
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{product.name}</p>
              {product.brandName ? (
                <p className="text-zinc-500">ブランド: {product.brandName}</p>
              ) : null}
            </div>
          </div>
        ) : null}
        {!lookupPending && !lookupError && product?.found === false ? (
          <p className="text-sm text-zinc-500">
            商品情報が見つかりませんでした（Yahoo!ショッピング未出品の可能性）。
          </p>
        ) : null}
        {!result && !lookupPending ? (
          <p className="text-sm text-zinc-500">コードを読み取ると照会します。</p>
        ) : null}
        <p className="text-xs text-zinc-400">
          データ出典: Yahoo!ショッピング（アフィリエイトなし）
        </p>
      </section>

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label htmlFor="manual-scan-value" className="block text-sm font-medium">
          手動入力（カメラが使えないときの確認用）
        </label>
        <div className="flex flex-col gap-2">
          <input
            id="manual-scan-value"
            type="text"
            value={manualValue}
            onChange={(event) => setManualValue(event.target.value)}
            placeholder="JAN / QR の文字列"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-zinc-900 outline-none focus:border-zinc-500"
          />
          <button
            type="submit"
            className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900"
          >
            表示
          </button>
        </div>
      </form>

      {typeof document !== "undefined" && overlayOpen
        ? createPortal(
            <div
              className="fixed inset-0 z-50 flex flex-col bg-black text-white"
              role="dialog"
              aria-modal="true"
              aria-label="バーコードスキャン"
            >
              <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
                <p className="text-sm font-medium">
                  {starting
                    ? "カメラ起動中…"
                    : result
                      ? lookupPending
                        ? "商品を調べています…"
                        : "読み取り完了"
                      : "コードを枠に合わせてください"}
                </p>
                <button
                  type="button"
                  onClick={() => void cancelOverlay()}
                  className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
                >
                  キャンセル
                </button>
              </header>

              <div
                id={regionId}
                className="min-h-0 flex-1 overflow-hidden [&_img]:mx-auto [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />

              <footer className="shrink-0 space-y-2 bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {cameraError ? (
                  <p className="text-sm text-red-300">{cameraError}</p>
                ) : null}
                {result ? (
                  <div className="space-y-1 text-sm">
                    <p className="font-medium text-emerald-300">読み取りました</p>
                    <p className="break-all font-mono text-white">
                      {result.rawValue}
                    </p>
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
                          onClick={() => void dismissOverlayToResults()}
                          className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
                        >
                          結果を見る
                        </button>
                      </div>
                    ) : null}
                    {lookupError ? (
                      <button
                        type="button"
                        onClick={() => void dismissOverlayToResults()}
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
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
