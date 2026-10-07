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
    continuousListSectionId,
    scanMode,
    toggleScanMode,
    continuousEntries,
    duplicateNotice,
    continuousLookupActive,
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
    finishContinuousScan,
    handleManualSubmit,
    handleCopy,
  } = useBarcodeScanFlow();

  const isContinuous = scanMode === "continuous";

  return (
    <div id="scan" className="space-y-4 md:hidden">
      <p className="text-sm text-zinc-600">
        左の「単体 / 連続」で読取モードを切り替え、「スキャン開始」でカメラを開きます（HTTPS
        推奨・カメラ許可が必要）。
      </p>

      <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
        <button
          type="button"
          onClick={toggleScanMode}
          disabled={overlayOpen || starting}
          aria-pressed={isContinuous}
          aria-label={
            isContinuous
              ? "連続読取モード。タップで単体に切り替え"
              : "単体読取モード。タップで連続に切り替え"
          }
          className="shrink-0 border-r border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-emerald-100 aria-pressed:text-emerald-900"
        >
          {isContinuous ? "連続" : "単体"}
        </button>
        <button
          type="button"
          onClick={() => void startScan()}
          disabled={overlayOpen || starting}
          className="flex-1 bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting
            ? "起動中…"
            : isContinuous
              ? "連続スキャン開始"
              : "スキャン開始"}
        </button>
      </div>

      {cameraError && !overlayOpen ? (
        <p className="text-sm text-red-600">{cameraError}</p>
      ) : null}

      {isContinuous && continuousEntries.length > 0 ? (
        <section
          id={continuousListSectionId}
          className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3"
          aria-live="polite"
          aria-labelledby="continuous-list-heading"
        >
          <h3
            id="continuous-list-heading"
            className="text-sm font-medium text-zinc-800"
          >
            連続読取リスト（{continuousEntries.length} 件・JAN 重複なし）
          </h3>
          <ul className="max-h-64 space-y-2 overflow-y-auto text-sm">
            {continuousEntries.map((entry) => (
              <li
                key={entry.id}
                className="rounded border border-zinc-200 bg-white px-3 py-2"
              >
                <p className="font-mono text-xs text-zinc-600">{entry.code}</p>
                {entry.lookupStatus === "loading" ||
                entry.lookupStatus === "pending" ? (
                  <p className="text-zinc-500">商品検索中…</p>
                ) : null}
                {entry.lookupError ? (
                  <p className="text-red-600">{entry.lookupError}</p>
                ) : null}
                {entry.product?.found === true ? (
                  <p className="font-medium text-zinc-800">
                    {entry.product.name}
                  </p>
                ) : null}
                {entry.product?.found === false ? (
                  <p className="text-zinc-500">商品情報なし</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section
        className="space-y-2 rounded-md border border-zinc-200 bg-zinc-50 px-4 py-3"
        aria-live="polite"
        aria-labelledby="scan-result-heading"
      >
        <h3 id="scan-result-heading" className="text-sm font-medium text-zinc-800">
          読取結果{isContinuous ? "（直近）" : ""}
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

      {!isContinuous ? (
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
      ) : (
        <p
          id={productLookupSectionId}
          className="text-sm text-zinc-500"
        >
          連続モードでは読取ごとにリストへ追加し、商品照会は順番に実行します（同一
          JAN は 1 件のみ）。
        </p>
      )}

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
              aria-label={
                isContinuous ? "連続バーコードスキャン" : "バーコードスキャン"
              }
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
                  onClick={() =>
                    void (isContinuous ? finishContinuousScan() : cancelOverlay())
                  }
                  className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
                >
                  {isContinuous ? "完了" : "キャンセル"}
                </button>
              </header>

              <div
                id={regionId}
                className="min-h-0 flex-1 overflow-hidden [&_img]:mx-auto [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
              />

              <footer className="max-h-[40vh] shrink-0 space-y-2 overflow-y-auto bg-black/90 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                {cameraError ? (
                  <p className="text-sm text-red-300">{cameraError}</p>
                ) : null}
                {duplicateNotice ? (
                  <p className="text-sm text-amber-200">{duplicateNotice}</p>
                ) : null}

                {isContinuous ? (
                  <div className="space-y-2 text-sm">
                    <p className="text-zinc-400">
                      {scanning
                        ? "読み取り待機中…同じ JAN は追加しません"
                        : starting
                          ? "しばらくお待ちください"
                          : null}
                    </p>
                    {continuousEntries.length > 0 ? (
                      <ul className="space-y-1">
                        {continuousEntries.slice(0, 5).map((entry) => (
                          <li
                            key={entry.id}
                            className="rounded bg-white/10 px-2 py-1 font-mono text-xs"
                          >
                            {entry.code}
                            {entry.product?.found === true
                              ? ` — ${entry.product.name}`
                              : entry.lookupStatus === "loading" ||
                                  entry.lookupStatus === "pending"
                                ? " …"
                                : entry.product?.found === false
                                  ? " — 商品なし"
                                  : entry.lookupError
                                    ? " — エラー"
                                    : ""}
                          </li>
                        ))}
                        {continuousEntries.length > 5 ? (
                          <li className="text-zinc-500">
                            他 {continuousEntries.length - 5} 件…
                          </li>
                        ) : null}
                      </ul>
                    ) : null}
                    {continuousLookupActive ? (
                      <p className="text-zinc-400">商品照会を実行中…</p>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => void finishContinuousScan()}
                      className="w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white"
                    >
                      読取を終了してリストを見る
                    </button>
                  </div>
                ) : result ? (
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
