/**
 * 直近の読取結果表示とコピー。
 */

import type { ScanResult } from "@/lib/scan/types";

type ScanResultPanelProps = {
  result: ScanResult | null;
  isContinuous: boolean;
  copied: boolean;
  onCopy: () => void;
};

export function ScanResultPanel({
  result,
  isContinuous,
  copied,
  onCopy,
}: ScanResultPanelProps) {
  return (
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
          onClick={onCopy}
          className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900"
        >
          {copied ? "コピーしました" : "値をコピー"}
        </button>
      ) : null}
    </section>
  );
}
