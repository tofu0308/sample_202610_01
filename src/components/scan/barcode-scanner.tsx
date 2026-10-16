"use client";

/**
 * QR / バーコード読み取り UI の組み立て（Client Component）。
 * スキャン表示は scan/*、登録ボタンは items/* をここでつなぐ（scan 葉コンポーネントは items を import しない）。
 */

import { createPortal } from "react-dom";
import { RegisterItemButton } from "@/components/items/register-item-button";
import { RegisterItemsButton } from "@/components/items/register-items-button";
import { ContinuousScanList } from "@/components/scan/continuous-scan-list";
import { ManualScanForm } from "@/components/scan/manual-scan-form";
import { ScanModeControls } from "@/components/scan/scan-mode-controls";
import { ScanOverlay } from "@/components/scan/scan-overlay";
import { SingleScanList } from "@/components/scan/single-scan-list";
import { ListUpdatingBanner } from "@/components/ui/list-updating-banner";
import { useBarcodeScanFlow } from "@/hooks/scan/use-barcode-scan-flow";
import type { ItemLimitView } from "@/lib/items/item-limit-view";

export type { ScanResult } from "@/lib/scan/types";

type BarcodeScannerProps = {
  /** 登録件数上限。ボタン disabled と文言に使う */
  itemLimit: ItemLimitView;
};

export function BarcodeScanner({ itemLimit }: BarcodeScannerProps) {
  const flow = useBarcodeScanFlow();
  const isContinuous = flow.scanMode === "continuous";
  const onRegistered = flow.afterRegistered;

  return (
    <div id="scan" className="space-y-4">
      <ListUpdatingBanner active={flow.listUpdating} />
      {/* カメラはスマホ向け。PC（md+）は手動入力のみ */}
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
          showEmptyList={flow.showEmptyList}
          renderBulkRegister={(products) => (
            <RegisterItemsButton
              products={products}
              onRegistered={onRegistered}
              itemLimit={itemLimit}
            />
          )}
          renderRegisterAction={(product) => (
            <RegisterItemButton
              product={product}
              compact
              onRegistered={onRegistered}
              itemLimit={itemLimit}
            />
          )}
        />
      ) : (
        <SingleScanList
          sectionId={flow.productLookupSectionId}
          result={flow.result}
          product={flow.product}
          lookupPending={flow.lookupPending}
          lookupError={flow.lookupError}
          showEmptyList={flow.showEmptyList}
          renderRegisterAction={(product) => (
            <RegisterItemButton
              product={product}
              compact
              onRegistered={onRegistered}
              itemLimit={itemLimit}
            />
          )}
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
