"use client";

/**
 * QR / バーコード読み取り UI（Client Component）。
 * 読取結果はリスト行に統一（サムネ・商品名・JANコードコピー・登録）。
 */

import { createPortal } from "react-dom";
import { ContinuousScanList } from "@/components/scan/continuous-scan-list";
import { ManualScanForm } from "@/components/scan/manual-scan-form";
import { ScanModeControls } from "@/components/scan/scan-mode-controls";
import { ScanOverlay } from "@/components/scan/scan-overlay";
import { SingleScanList } from "@/components/scan/single-scan-list";
import { useBarcodeScanFlow } from "@/hooks/scan/use-barcode-scan-flow";

export type { ScanResult } from "@/lib/scan/types";

export function BarcodeScanner() {
  const flow = useBarcodeScanFlow();
  const isContinuous = flow.scanMode === "continuous";

  return (
    <div id="scan" className="space-y-4">
      {/* カメラはスマホ向け。PC（md+）は手動入力のみ（設計書 §5） */}
      <p className="text-sm text-zinc-400 md:hidden">
        単体／連続でスキャンできます。
      </p>
      <p className="hidden text-sm text-zinc-400 md:block">
        JANコードを入力して照会してください。
      </p>

      <div className="md:hidden">
        <ScanModeControls
          scanMode={flow.scanMode}
          starting={flow.starting}
          overlayOpen={flow.overlayOpen}
          onSelectMode={flow.selectScanMode}
          onStart={() => void flow.startScan()}
        />
      </div>

      {flow.cameraError && !flow.overlayOpen ? (
        <p className="text-sm text-red-400 md:hidden">{flow.cameraError}</p>
      ) : null}

      {isContinuous ? (
        <ContinuousScanList
          sectionId={flow.continuousListSectionId}
          entries={flow.continuousEntries}
          onRegistered={flow.afterRegistered}
        />
      ) : (
        <SingleScanList
          sectionId={flow.productLookupSectionId}
          result={flow.result}
          product={flow.product}
          lookupPending={flow.lookupPending}
          lookupError={flow.lookupError}
          onRegistered={flow.afterRegistered}
        />
      )}

      <ManualScanForm
        value={flow.manualValue}
        onChange={flow.setManualValue}
        onSubmit={flow.handleManualSubmit}
      />

      {typeof document !== "undefined" && flow.overlayOpen
        ? createPortal(
            <ScanOverlay
              isContinuous={isContinuous}
              regionId={flow.regionId}
              scanning={flow.scanning}
              starting={flow.starting}
              cameraError={flow.cameraError}
              result={flow.result}
              product={flow.product}
              lookupPending={flow.lookupPending}
              lookupError={flow.lookupError}
              continuousEntries={flow.continuousEntries}
              latestContinuousEntry={flow.latestContinuousEntry}
              duplicateNotice={flow.duplicateNotice}
              continuousLookupActive={flow.continuousLookupActive}
              onCancel={() => void flow.cancelOverlay()}
              onFinishContinuous={() => void flow.finishContinuousScan()}
              onDismissToResults={() => void flow.dismissOverlayToResults()}
            />,
            document.body,
          )
        : null}
    </div>
  );
}
