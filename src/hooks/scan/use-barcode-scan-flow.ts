/**
 * バーコード読取〜商品照会〜オーバーレイ閉鎖までの一連フロー。
 * 連続モードの排他・キューは useContinuousScan に委譲する。
 */

import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useTransition,
  type FormEvent,
} from "react";
import { useBarcodeCamera } from "@/hooks/scan/use-barcode-camera";
import { useBodyScrollLock } from "@/hooks/scan/use-body-scroll-lock";
import { useContinuousScan } from "@/hooks/scan/use-continuous-scan";
import { useProductLookup } from "@/hooks/scan/use-product-lookup";
import { SAME_VALUE_COOLDOWN_MS } from "@/lib/scan/constants";
import type { ScanMode, ScanResult } from "@/lib/scan/types";

const PRODUCT_LOOKUP_SECTION_ID = "product-lookup";
const CONTINUOUS_LIST_SECTION_ID = "continuous-scan-list";

export function useBarcodeScanFlow() {
  const router = useRouter();
  const [isListRefreshing, startListTransition] = useTransition();
  const lastRawRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);

  const [scanMode, setScanMode] = useState<ScanMode>("single");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [manualValue, setManualValue] = useState("");
  /** 登録後クリアなどでリスト枠だけ残す（初回表示では出さない） */
  const [showEmptyList, setShowEmptyList] = useState(false);
  /** 読取クリア後〜一覧 RSC 反映まで（ボタン unmount 後もバナーを出す） */
  const [listUpdating, setListUpdating] = useState(false);

  const {
    product,
    pending: lookupPending,
    error: lookupError,
    lookup,
    lookupOnce,
    reset: resetProductLookup,
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
    const hadNone = continuousEntries.length === 0;
    await closeOverlay();
    if (hadNone) {
      setShowEmptyList(true);
    }
    scrollToContinuousList();
  }, [closeOverlay, continuousEntries.length, scrollToContinuousList]);

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
      setShowEmptyList(false);
      setResult({
        rawValue: trimmed,
        format,
        scannedAt: new Date().toISOString(),
      });

      // ヒット時も自動クローズしない。結果を見てから「結果を見る」で閉じる
      if (fromCamera) {
        await stop();
      }

      await lookup(trimmed);
    },
    [lookup, stop],
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

  const selectScanMode = useCallback(
    (mode: ScanMode) => {
      if (overlayOpen || starting) {
        return;
      }
      setScanMode(mode);
      // モード切替だけでは空リスト枠を出さない
      setShowEmptyList(false);
    },
    [overlayOpen, starting],
  );

  const clearScanResults = useCallback(() => {
    setResult(null);
    setManualValue("");
    resetProductLookup();
    resetContinuousBatch();
    lastRawRef.current = null;
    lastAtRef.current = 0;
    setCameraError(null);
    setShowEmptyList(true);
  }, [resetContinuousBatch, resetProductLookup, setCameraError]);

  const afterRegistered = useCallback(() => {
    // ボタンが消えても分かるよう、refresh 完了までバナーを出す
    setListUpdating(true);
    clearScanResults();
    startListTransition(() => {
      router.refresh();
    });
    requestAnimationFrame(() => {
      document
        .getElementById("items")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }, [clearScanResults, router]);

  useEffect(() => {
    if (listUpdating && !isListRefreshing) {
      setListUpdating(false);
    }
  }, [isListRefreshing, listUpdating]);

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
        setCameraError("照会する値を入力してください。");
        return;
      }
      void applyResult(value, "MANUAL", false);
    },
    [applyResult, manualValue, setCameraError],
  );

  return {
    productLookupSectionId: PRODUCT_LOOKUP_SECTION_ID,
    continuousListSectionId: CONTINUOUS_LIST_SECTION_ID,
    scanMode,
    selectScanMode,
    afterRegistered,
    showEmptyList,
    /** 一覧 refresh 中（画面下部バナー用） */
    listUpdating: listUpdating || isListRefreshing,
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
    startScan,
    cancelOverlay,
    dismissOverlayToResults,
    finishContinuousScan,
    handleManualSubmit,
  };
}
