"use client";

/**
 * QR / バーコード読み取り UI（Client Component）。
 * 読取結果・商品情報の別パネルは出さず、リスト行（JAN コピー＋登録）に統一する。
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
      <p className="text-sm text-zinc-600">
        「単体 / 連続」で読取モードを切り替えられます。カメラはスマホ向けです。PC
        では下の手動入力で JAN を入れて登録できます（HTTPS
        推奨・カメラ許可が必要）。各行の「JANをコピー」でコードを取れます。
      </p>

      <ScanModeControls
        isContinuous={isContinuous}
        starting={flow.starting}
        overlayOpen={flow.overlayOpen}
        onToggleMode={flow.toggleScanMode}
        onStart={() => void flow.startScan()}
      />

      {flow.cameraError && !flow.overlayOpen ? (
        <p className="text-sm text-red-600">{flow.cameraError}</p>
      ) : null}

      {isContinuous ? (
        <ContinuousScanList
          sectionId={flow.continuousListSectionId}
          entries={flow.continuousEntries}
        />
      ) : (
        <SingleScanList
          sectionId={flow.productLookupSectionId}
          result={flow.result}
          product={flow.product}
          lookupPending={flow.lookupPending}
          lookupError={flow.lookupError}
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
