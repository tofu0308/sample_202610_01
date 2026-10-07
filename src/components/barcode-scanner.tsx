"use client";

/**
 * QR / バーコード読み取り（Client Component）。
 * html5-qrcode の Html5Qrcode を使い、ボタン操作でのみカメラを開始する。
 * 撮影中は画面全体を覆うオーバーレイにし、スクロールなしで使えるようにする。
 * 読取後は POST /api/products/lookup で Yahoo!ショッピングから商品名を照会する（アフィ無し）。
 * PC（md 以上）ではセクションごと非表示。
 */

import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode";
import {
  useEffect,
  useId,
  useRef,
  useState,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";

/** 設計書どおりの読取結果（永続化しない） */
export type ScanResult = {
  rawValue: string;
  format?: string;
  scannedAt: string;
};

/** 同一値の連続コールバックで表示がチラつかないようにする間隔 */
const SAME_VALUE_COOLDOWN_MS = 2000;

/** /api/products/lookup の成功レスポンス（アフィ URL は含まない） */
type ProductLookupResponse =
  | {
      found: true;
      code: string;
      name: string;
      imageUrl?: string;
      brandName?: string;
      source: "yahoo_shopping";
    }
  | {
      found: false;
      code: string;
      source: "yahoo_shopping";
    }
  | { error: string };

function toFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("notallowed") ||
    lower.includes("permission") ||
    lower.includes("denied")
  ) {
    return "カメラの使用が許可されませんでした。ブラウザの設定を確認してください。";
  }
  if (
    lower.includes("notfound") ||
    lower.includes("requested device not found")
  ) {
    return "利用できるカメラが見つかりませんでした。";
  }
  if (lower.includes("notsupported") || lower.includes("secure")) {
    return "この環境ではカメラを起動できません。HTTPS または localhost で開いてください。";
  }
  return message || "カメラの起動に失敗しました。";
}

export function BarcodeScanner() {
  const reactId = useId();
  // html5-qrcode は elementId 文字列を要求する。useId の「:」は CSS セレクタで困るので除去する
  const regionId = `barcode-reader-${reactId.replace(/:/g, "")}`;

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const lastRawRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);

  const [overlayOpen, setOverlayOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [product, setProduct] = useState<Extract<
    ProductLookupResponse,
    { found: boolean }
  > | null>(null);
  const [lookupPending, setLookupPending] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [copied, setCopied] = useState(false);

  // オーバーレイ中は背面のスクロールを止める
  useEffect(() => {
    if (!overlayOpen) {
      return;
    }
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [overlayOpen]);

  // アンマウント時は必ず stop してカメラインジケータを残さない
  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) {
        void scanner.stop().catch(() => {
          // アンマウント中の失敗は握りつぶす（表示先がない）
        });
      }
    };
  }, []);

  /** カメラ画面を終了し、下の商品情報セクションへ視線を移す（「戻る」感を減らす） */
  async function dismissOverlayToResults() {
    await stopScanner();
    setOverlayOpen(false);
    setStarting(false);
    // オーバーレイ解除後にスクロール（DOM が戻ってから）
    requestAnimationFrame(() => {
      document
        .getElementById("product-lookup")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function lookupProduct(
    code: string,
    options?: { dismissOverlayWhenDone?: boolean },
  ) {
    setLookupPending(true);
    setLookupError(null);
    setProduct(null);

    try {
      const response = await fetch("/api/products/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json; charset=utf-8" },
        body: JSON.stringify({ code }),
      });
      const data = (await response.json()) as ProductLookupResponse;

      if (!response.ok || "error" in data) {
        setLookupError(
          "error" in data ? data.error : "商品情報の取得に失敗しました",
        );
        return;
      }

      setProduct(data);
    } catch {
      setLookupError("商品情報の取得中にネットワークエラーが発生しました");
    } finally {
      setLookupPending(false);
      // スキャン成功後は自動でカメラを閉じ、結果を同じページ内で見せる
      if (options?.dismissOverlayWhenDone) {
        await dismissOverlayToResults();
      }
    }
  }

  function applyResult(rawValue: string, format?: string) {
    const trimmed = rawValue.trim();
    if (trimmed === "") {
      return;
    }

    const now = Date.now();
    if (
      lastRawRef.current === trimmed &&
      now - lastAtRef.current < SAME_VALUE_COOLDOWN_MS
    ) {
      return;
    }
    lastRawRef.current = trimmed;
    lastAtRef.current = now;
    setCopied(false);
    setResult({
      rawValue: trimmed,
      format,
      scannedAt: new Date().toISOString(),
    });

    // カメラ中の読取なら、すぐストリームを止め、照会後にオーバーレイを自動クローズ
    const fromCamera = overlayOpen;
    if (fromCamera) {
      void stopScanner();
    }
    void lookupProduct(trimmed, { dismissOverlayWhenDone: fromCamera });
  }

  async function stopScanner() {
    const scanner = scannerRef.current;
    if (!scanner) {
      setScanning(false);
      return;
    }

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
      scanner.clear();
    } catch {
      // 閉じる操作を優先。詳細は next start で分かるのでここでは握りつぶす
    } finally {
      scannerRef.current = null;
      setScanning(false);
    }
  }

  /** 未読取のままやめるとき（成功時は自動クローズするので主にキャンセル用） */
  async function handleCancelOverlay() {
    await stopScanner();
    setOverlayOpen(false);
    setStarting(false);
  }

  // PC 幅へリサイズしたらカメラを止める（md:hidden と表示方針を揃える）
  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) {
        void handleCancelOverlay();
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- リサイズ検知の一度きり登録
  }, []);

  async function handleStart() {
    setError(null);
    // 全画面を先に出してから start（寸法 0 / スクロール位置の問題を避ける）
    setOverlayOpen(true);
    setStarting(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(regionId, { verbose: false });
      }
      const scanner = scannerRef.current;

      const onSuccess = (
        decodedText: string,
        decodedResult: Html5QrcodeResult,
      ) => {
        applyResult(decodedText, decodedResult.result.format?.formatName);
      };

      const cameraConfig = {
        fps: 10,
        // 全画面では広めの読取枠。バーコードは横長の方が読みやすい
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.floor(Math.min(320, viewfinderWidth * 0.85));
          const height = Math.floor(Math.min(200, viewfinderHeight * 0.3));
          return { width, height };
        },
      };

      try {
        await scanner.start(
          { facingMode: "environment" },
          cameraConfig,
          onSuccess,
          () => {
            // フレームごとの「見つからない」は正常系なので無視
          },
        );
      } catch {
        await scanner.start(
          { facingMode: "user" },
          cameraConfig,
          onSuccess,
          () => {},
        );
      }

      setScanning(true);
    } catch (err) {
      setError(toFriendlyError(err));
      setScanning(false);
      scannerRef.current = null;
      setOverlayOpen(false);
    } finally {
      setStarting(false);
    }
  }

  function handleManualSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const value = manualValue.trim();
    if (value === "") {
      setError("表示する値を入力してください。");
      return;
    }
    applyResult(value, "MANUAL");
  }

  async function handleCopy() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.rawValue);
      setCopied(true);
    } catch {
      setError("クリップボードへのコピーに失敗しました。");
    }
  }

  return (
    <div id="scan" className="space-y-4 md:hidden">
      <p className="text-sm text-zinc-600">
        「スキャン開始」を押すと画面全体でカメラが開きます。カメラ許可が必要です（HTTPS
        推奨）。
      </p>

      <button
        type="button"
        onClick={() => void handleStart()}
        disabled={overlayOpen || starting}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {starting ? "起動中…" : "スキャン開始"}
      </button>

      {error && !overlayOpen ? (
        <p className="text-sm text-red-600">{error}</p>
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
        id="product-lookup"
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
              // 外部画像。学習用に next/image は使わず素の img
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

      {/* body 直下へ portal。md:hidden の親に閉じ込めるとリサイズ時にカメラだけ残るのを防ぐ */}
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
                  onClick={() => void handleCancelOverlay()}
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
                {error ? <p className="text-sm text-red-300">{error}</p> : null}
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
                      <p className="text-zinc-400">商品情報なし</p>
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
