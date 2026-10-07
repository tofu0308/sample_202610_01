"use client";

/**
 * QR / バーコード読み取り（Client Component）。
 * html5-qrcode の Html5Qrcode を使い、ボタン操作でのみカメラを開始する（自動起動しない）。
 * Phase 1 は画面表示のみ。DB 保存はしない。
 */

import { Html5Qrcode, type Html5QrcodeResult } from "html5-qrcode";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";

/** 設計書どおりの読取結果（永続化しない） */
export type ScanResult = {
  rawValue: string;
  format?: string;
  scannedAt: string;
};

/** 同一値の連続コールバックで表示がチラつかないようにする間隔 */
const SAME_VALUE_COOLDOWN_MS = 2000;

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

  const [scanning, setScanning] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [copied, setCopied] = useState(false);

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
  }

  async function handleStart() {
    setError(null);
    // プレビュー領域を先に開いてから start する（display:none だと寸法 0 で失敗しうる）
    setStarting(true);

    try {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });

      // 背面カメラ優先（スマホ）。失敗時はインカメラへフォールバック
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
        // バーコードは横長の方が読みやすい。画面幅に合わせて縮める
        qrbox: (viewfinderWidth: number, viewfinderHeight: number) => {
          const width = Math.floor(Math.min(320, viewfinderWidth * 0.9));
          const height = Math.floor(Math.min(180, viewfinderHeight * 0.35));
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
    } finally {
      setStarting(false);
    }
  }

  async function handleStop() {
    setError(null);
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
    } catch (err) {
      setError(toFriendlyError(err));
    } finally {
      scannerRef.current = null;
      setScanning(false);
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
    <div id="scan" className="space-y-4">
      <p className="text-sm text-zinc-600">
        「スキャン開始」を押すとカメラが起動します。カメラ許可が必要です。HTTPS
        または localhost で開いてください。
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void handleStart()}
          disabled={scanning || starting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {starting ? "起動中…" : "スキャン開始"}
        </button>
        <button
          type="button"
          onClick={() => void handleStop()}
          disabled={!scanning}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
        >
          停止
        </button>
      </div>

      {/* html5-qrcode が video を差し込む領域。DOM には残し、非表示時は潰す */}
      <div
        id={regionId}
        className={
          scanning || starting
            ? "min-h-48 overflow-hidden rounded-md border border-zinc-300 bg-black [&_video]:w-full"
            : "h-0 overflow-hidden"
        }
      />

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

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

      <form onSubmit={handleManualSubmit} className="space-y-2">
        <label htmlFor="manual-scan-value" className="block text-sm font-medium">
          手動入力（カメラが使えないときの確認用）
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
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
    </div>
  );
}
