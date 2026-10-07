/**
 * バーコード読取〜商品照会〜オーバーレイ閉鎖までの一連フロー。
 * 単体 / 連続モードを切り替え、連続時は JAN 重複を待ちリストで排他する。
 */

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useBarcodeCamera } from "@/hooks/use-barcode-camera";
import { useBodyScrollLock } from "@/hooks/use-body-scroll-lock";
import { useProductLookup } from "@/hooks/use-product-lookup";
import { normalizeBarcodeDigits } from "@/lib/scan/normalize-barcode";
import type { ContinuousScanEntry, ScanMode, ScanResult } from "@/lib/scan/types";

/** 同一値の連続コールバックで表示がチラつかないようにする間隔 */
const SAME_VALUE_COOLDOWN_MS = 2000;

const PRODUCT_LOOKUP_SECTION_ID = "product-lookup";
const CONTINUOUS_LIST_SECTION_ID = "continuous-scan-list";

function createEntryId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

export function useBarcodeScanFlow() {
  const lastRawRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);

  const [scanMode, setScanMode] = useState<ScanMode>("single");
  const [continuousEntries, setContinuousEntries] = useState<
    ContinuousScanEntry[]
  >([]);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const duplicateNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  /** 正規化後 JAN。追加済みなら絶対に再カウントしない */
  const codesInBatchRef = useRef<Set<string>>(new Set());
  /** 照会キュー投入済み（処理中含む）。二重 fetch で結果を上書きしない */
  const lookupEnqueuedRef = useRef<Set<string>>(new Set());
  const lookupQueueRef = useRef<string[]>([]);
  const lookupProcessingRef = useRef(false);

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

  const showDuplicateNotice = useCallback((code: string) => {
    if (duplicateNoticeTimerRef.current) {
      clearTimeout(duplicateNoticeTimerRef.current);
    }
    setDuplicateNotice(`JAN ${code} は既にリストにあります`);
    duplicateNoticeTimerRef.current = setTimeout(() => {
      setDuplicateNotice(null);
      duplicateNoticeTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (duplicateNoticeTimerRef.current) {
        clearTimeout(duplicateNoticeTimerRef.current);
      }
    };
  }, []);

  const updateContinuousEntry = useCallback(
    (
      code: string,
      patch: Partial<
        Pick<
          ContinuousScanEntry,
          "lookupStatus" | "product" | "lookupError"
        >
      >,
    ) => {
      setContinuousEntries((prev) =>
        prev.map((entry) => {
          if (entry.code !== code) {
            return entry;
          }
          // ヒット済みを後続の not found / エラーで潰さない（二重照会の保険）
          if (
            entry.product?.found === true &&
            (patch.product?.found === false || patch.lookupStatus === "error")
          ) {
            return entry;
          }
          return { ...entry, ...patch };
        }),
      );
    },
    [],
  );

  const processLookupQueue = useCallback(async () => {
    if (lookupProcessingRef.current) {
      return;
    }
    lookupProcessingRef.current = true;

    while (lookupQueueRef.current.length > 0) {
      const code = lookupQueueRef.current.shift();
      if (!code) {
        continue;
      }

      updateContinuousEntry(code, { lookupStatus: "loading" });
      const { data, error: message } = await lookupOnce(code);

      if (message) {
        updateContinuousEntry(code, {
          lookupStatus: "error",
          lookupError: message,
          product: null,
        });
      } else {
        updateContinuousEntry(code, {
          lookupStatus: "done",
          product: data,
          lookupError: null,
        });
      }
    }

    lookupProcessingRef.current = false;
  }, [lookupOnce, updateContinuousEntry]);

  const enqueueContinuousLookup = useCallback(
    (code: string) => {
      // 同一 JAN の二重照会は Yahoo レート制限で「商品なし」に見えやすい
      if (lookupEnqueuedRef.current.has(code)) {
        return;
      }
      lookupEnqueuedRef.current.add(code);
      lookupQueueRef.current.push(code);
      void processLookupQueue();
    },
    [processLookupQueue],
  );

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

  const resetContinuousBatch = useCallback(() => {
    codesInBatchRef.current = new Set();
    lookupEnqueuedRef.current = new Set();
    lookupQueueRef.current = [];
    setContinuousEntries([]);
    setDuplicateNotice(null);
  }, []);

  const applyContinuousDecode = useCallback(
    (rawValue: string, format: string | undefined) => {
      const trimmed = rawValue.trim();
      if (trimmed === "") {
        return;
      }

      // カウント判定は正規化 JAN で先に行う（生文字列の差で二重追加しない）
      const code = normalizeBarcodeDigits(trimmed);
      if (!code) {
        setCameraError(
          "8〜14 桁の JAN / バーコードとして認識できませんでした。",
        );
        return;
      }

      if (codesInBatchRef.current.has(code)) {
        // 同一フレーム連打でも件数に入れない。通知だけ間引く
        const now = Date.now();
        if (
          lastRawRef.current !== code ||
          now - lastAtRef.current >= SAME_VALUE_COOLDOWN_MS
        ) {
          lastRawRef.current = code;
          lastAtRef.current = now;
          showDuplicateNotice(code);
        }
        return;
      }

      codesInBatchRef.current.add(code);
      lastRawRef.current = code;
      lastAtRef.current = Date.now();
      setCopied(false);
      setResult({
        rawValue: trimmed,
        format,
        scannedAt: new Date().toISOString(),
      });

      const entry: ContinuousScanEntry = {
        id: createEntryId(),
        code,
        rawValue: trimmed,
        format,
        scannedAt: new Date().toISOString(),
        lookupStatus: "pending",
        product: null,
        lookupError: null,
      };
      // 念のため state 側でも同一 code は弾く
      setContinuousEntries((prev) => {
        if (prev.some((item) => item.code === code)) {
          return prev;
        }
        return [entry, ...prev];
      });
      enqueueContinuousLookup(code);
    },
    [enqueueContinuousLookup, setCameraError, showDuplicateNotice],
  );

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

  const continuousLookupActive = continuousEntries.some(
    (entry) =>
      entry.lookupStatus === "pending" || entry.lookupStatus === "loading",
  );

  /** オーバーレイは直近 1 件だけ表示し、カメラ領域を削らない */
  const latestContinuousEntry = continuousEntries[0] ?? null;

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
