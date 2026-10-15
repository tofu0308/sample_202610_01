/**
 * 全画面スキャナ（portal 先のシェル）。
 * ヘッダ／単体フッタ／連続フッタに分け、ここは組み立てと離脱アクションの振り分けだけ担う。
 */

import { ScanOverlayContinuousFooter } from "@/components/scan/scan-overlay-continuous-footer";
import { ScanOverlayHeader } from "@/components/scan/scan-overlay-header";
import { ScanOverlaySingleFooter } from "@/components/scan/scan-overlay-single-footer";
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
  const singleHasResult = !isContinuous && result !== null;
  const headerActionLabel = isContinuous
    ? "閉じる"
    : singleHasResult
      ? "閉じる"
      : "キャンセル";
  const onHeaderAction = isContinuous
    ? onFinishContinuous
    : singleHasResult
      ? onDismissToResults
      : onCancel;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label={isContinuous ? "連続バーコードスキャン" : "バーコードスキャン"}
    >
      <ScanOverlayHeader
        isContinuous={isContinuous}
        starting={starting}
        continuousCount={continuousEntries.length}
        hasSingleResult={singleHasResult}
        lookupPending={lookupPending}
        actionLabel={headerActionLabel}
        onAction={() => {
          void onHeaderAction();
        }}
      />

      <div
        id={regionId}
        className="min-h-0 flex-1 basis-0 overflow-hidden [&_img]:mx-auto [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />

      {isContinuous ? (
        <ScanOverlayContinuousFooter
          starting={starting}
          scanning={scanning}
          cameraError={cameraError}
          duplicateNotice={duplicateNotice}
          latestEntry={latestContinuousEntry}
          continuousLookupActive={continuousLookupActive}
          entryCount={continuousEntries.length}
          onFinish={() => {
            void onFinishContinuous();
          }}
        />
      ) : (
        <ScanOverlaySingleFooter
          starting={starting}
          scanning={scanning}
          cameraError={cameraError}
          result={result}
          product={product}
          lookupPending={lookupPending}
          lookupError={lookupError}
          onDismissToResults={() => {
            void onDismissToResults();
          }}
        />
      )}
    </div>
  );
}
