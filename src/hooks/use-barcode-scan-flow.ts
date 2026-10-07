/**
 * バーコード読取〜商品照会〜オーバーレイ閉鎖までの一連フロー。
 * UI コンポーネントは表示とイベント結線に集中させる。
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useBarcodeCamera } from "@/hooks/use-barcode-camera";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useProductLookup } from "@/hooks/use-product-lookup";
import type { ScanResult } from "@/lib/scan/types";

/** 同一値の連続コールバックで表示がチラつかないようにする間隔 */
const SAME_VALUE_COOLDOWN_MS = 2000;

const PRODUCT_LOOKUP_SECTION_ID = "product-lookup";

export function useBarcodeScanFlow() {
  const lastRawRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);

  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualValue, setManualValue] = useState("");
  const [copied, setCopied] = useState(false);

  const {
    product,
    pending: lookupPending,
    error: lookupError,
    lookup,
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

  const scrollToProductSection = useCallback(() => {
    requestAnimationFrame(() => {
      document
        .getElementById(PRODUCT_LOOKUP_SECTION_ID)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, []);

  const dismissOverlayToResults = useCallback(async () => {
    await closeOverlay();
    scrollToProductSection();
  }, [closeOverlay, scrollToProductSection]);

  const applyResult = useCallback(
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

  useEffect(() => {
    handleDecodeRef.current = (rawValue, format) => {
      void applyResult(rawValue, format, true);
    };
  }, [applyResult]);

  // PC 幅へリサイズしたらカメラを止める（md:hidden と表示方針を揃える）
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
    startScan: start,
    cancelOverlay,
    dismissOverlayToResults,
    handleManualSubmit,
    handleCopy,
  };
}
