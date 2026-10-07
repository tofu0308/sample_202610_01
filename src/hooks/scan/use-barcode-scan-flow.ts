/**
 * バーコード読取〜商品照会〜オーバーレイ閉鎖までの一連フロー。
 * 連続モードの排他・キューは useContinuousScan に委譲する。
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useBarcodeCamera } from "@/hooks/scan/use-barcode-camera";
import { useBodyScrollLock } from "@/hooks/scan/use-body-scroll-lock";
import { useContinuousScan } from "@/hooks/scan/use-continuous-scan";
import { useProductLookup } from "@/hooks/scan/use-product-lookup";
import type { ScanMode, ScanResult } from "@/lib/scan/types";

/** 単体モードで同一値の連続コールバックを間引く間隔 */
const SAME_VALUE_COOLDOWN_MS = 2000;

const PRODUCT_LOOKUP_SECTION_ID = "product-lookup";
const CONTINUOUS_LIST_SECTION_ID = "continuous-scan-list";

export function useBarcodeScanFlow() {
  const lastRawRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);

  const [scanMode, setScanMode] = useState<ScanMode>("single");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    product,
    pending: lookupPending,
    error: lookupError,
    lookup,
    lookupOnce,
  } = useProductLookup();

  const handleDecodeRef = useRef<(rawValue: string, format?: string) => void>(
    () => {},
  );

  const {
    regionId,
    overlayOpen,
    scanning,
    starting,
    error: cameraError,
    setError: setCameraError,
    start,
    stop,
    cancelOverlay,
    closeOverlay,
  } = useBarcodeCamera({
    onDecode: ({ rawValue, format }) => {
      handleDecodeRef.current(rawValue, format);
    },
  });

  useBodyScrollLock(overlayOpen);

  const {
    entries: continuousEntries,
    latestEntry: latestContinuousEntry,
    duplicateNotice,
    lookupActive: continuousLookupActive,
    applyDecode: applyContinuousDecode,
    resetBatch: resetContinuousBatch,
  } = useContinuousScan({
    lookupOnce,
    setCameraError,
    onAccepted: (accepted) => {
      setCopied(false);
      setResult(accepted);
    },
  });

  const scrollToProductSection = useCallback(() => {
    requestAnimationFrame(() => {
      document
        .getElementById(PRODUCT_LOOKUP_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const scrollToContinuousList = useCallback(() => {
    requestAnimationFrame(() => {
      document
        .getElementById(CONTINUOUS_LIST_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const dismissOverlayToResults = useCallback(async () => {
    await closeOverlay();
    scrollToProductSection();
  }, [closeOverlay, scrollToProductSection]);

  const finishContinuousScan = useCallback(async () => {
    await closeOverlay();
    scrollToContinuousList();
  }, [closeOverlay, scrollToContinuousList]);

  const applySingleResult = useCallback(
    async (rawValue: string, format: string | undefined, fromCamera: boolean) => {
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

      if (fromCamera) {
        await stop();
      }

      const lookedUp = await lookup(trimmed);
      if (fromCamera && lookedUp?.found) {
        await dismissOverlayToResults();
      }
    },
    [dismissOverlayToResults, lookup, stop],
  );

  const applyResult = useCallback(
    async (rawValue: string, format: string | undefined, fromCamera: boolean) => {
      if (scanMode === "continuous") {
        applyContinuousDecode(rawValue, format);
        return;
      }
      await applySingleResult(rawValue, format, fromCamera);
    },
    [applyContinuousDecode, applySingleResult, scanMode],
  );

  useEffect(() => {
    handleDecodeRef.current = (rawValue, format) => {
      void applyResult(rawValue, format, true);
    };
  }, [applyResult]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 768px)");
    const onChange = () => {
      if (media.matches) {
        void cancelOverlay();
      }
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [cancelOverlay]);

  const toggleScanMode = useCallback(() => {
    if (overlayOpen || starting) {
      return;
    }
    setScanMode((prev) => (prev === "single" ? "continuous" : "single"));
  }, [overlayOpen, starting]);

  const startScan = useCallback(async () => {
    if (scanMode === "continuous") {
      resetContinuousBatch();
      lastRawRef.current = null;
      lastAtRef.current = 0;
    }
    await start();
  }, [resetContinuousBatch, scanMode, start]);

  const handleManualSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setCameraError(null);
      const value = manualValue.trim();
      if (value === "") {
        setCameraError("表示する値を入力してください。");
        return;
      }
      void applyResult(value, "MANUAL", false);
    },
    [applyResult, manualValue, setCameraError],
  );

  const handleCopy = useCallback(async () => {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.rawValue);
      setCopied(true);
    } catch {
      setCameraError("クリップボードへのコピーに失敗しました。");
    }
  }, [result, setCameraError]);

  return {
    productLookupSectionId: PRODUCT_LOOKUP_SECTION_ID,
    continuousListSectionId: CONTINUOUS_LIST_SECTION_ID,
    scanMode,
    toggleScanMode,
    continuousEntries,
    latestContinuousEntry,
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
  };
}
