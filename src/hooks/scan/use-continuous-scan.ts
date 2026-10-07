/**
 * 連続スキャン専用: JAN 排他・照会キュー・重複通知。
 * 単体モードやカメラ制御は useBarcodeScanFlow 側に残す。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { createEntryId } from "@/lib/scan/create-entry-id";
import { normalizeBarcodeDigits } from "@/lib/scan/normalize-barcode";
import type { ContinuousScanEntry, ProductLookupResult, ScanResult } from "@/lib/scan/types";

const SAME_VALUE_COOLDOWN_MS = 2000;

type LookupOnceResult = {
  data: ProductLookupResult | null;
  error: string | null;
};

type UseContinuousScanOptions = {
  lookupOnce: (code: string) => Promise<LookupOnceResult>;
  setCameraError: (message: string | null) => void;
  /** 新規追加時に直近読取結果を親へ同期する */
  onAccepted: (result: ScanResult) => void;
};

export function useContinuousScan({
  lookupOnce,
  setCameraError,
  onAccepted,
}: UseContinuousScanOptions) {
  const [entries, setEntries] = useState<ContinuousScanEntry[]>([]);
  const [duplicateNotice, setDuplicateNotice] = useState<string | null>(null);
  const duplicateNoticeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );

  const lastCodeRef = useRef<string | null>(null);
  const lastAtRef = useRef(0);
  const codesInBatchRef = useRef<Set<string>>(new Set());
  const lookupEnqueuedRef = useRef<Set<string>>(new Set());
  const lookupQueueRef = useRef<string[]>([]);
  const lookupProcessingRef = useRef(false);

  const onAcceptedRef = useRef(onAccepted);
  useEffect(() => {
    onAcceptedRef.current = onAccepted;
  }, [onAccepted]);

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

  const updateEntry = useCallback(
    (
      code: string,
      patch: Partial<
        Pick<ContinuousScanEntry, "lookupStatus" | "product" | "lookupError">
      >,
    ) => {
      setEntries((prev) =>
        prev.map((entry) => {
          if (entry.code !== code) {
            return entry;
          }
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

      updateEntry(code, { lookupStatus: "loading" });
      const { data, error: message } = await lookupOnce(code);

      if (message) {
        updateEntry(code, {
          lookupStatus: "error",
          lookupError: message,
          product: null,
        });
      } else {
        updateEntry(code, {
          lookupStatus: "done",
          product: data,
          lookupError: null,
        });
      }
    }

    lookupProcessingRef.current = false;
  }, [lookupOnce, updateEntry]);

  const enqueueLookup = useCallback(
    (code: string) => {
      if (lookupEnqueuedRef.current.has(code)) {
        return;
      }
      lookupEnqueuedRef.current.add(code);
      lookupQueueRef.current.push(code);
      void processLookupQueue();
    },
    [processLookupQueue],
  );

  const resetBatch = useCallback(() => {
    codesInBatchRef.current = new Set();
    lookupEnqueuedRef.current = new Set();
    lookupQueueRef.current = [];
    lastCodeRef.current = null;
    lastAtRef.current = 0;
    setEntries([]);
    setDuplicateNotice(null);
  }, []);

  const applyDecode = useCallback(
    (rawValue: string, format: string | undefined) => {
      const trimmed = rawValue.trim();
      if (trimmed === "") {
        return;
      }

      const code = normalizeBarcodeDigits(trimmed);
      if (!code) {
        setCameraError(
          "8〜14 桁の JAN / バーコードとして認識できませんでした。",
        );
        return;
      }

      if (codesInBatchRef.current.has(code)) {
        const now = Date.now();
        if (
          lastCodeRef.current !== code ||
          now - lastAtRef.current >= SAME_VALUE_COOLDOWN_MS
        ) {
          lastCodeRef.current = code;
          lastAtRef.current = now;
          showDuplicateNotice(code);
        }
        return;
      }

      codesInBatchRef.current.add(code);
      lastCodeRef.current = code;
      lastAtRef.current = Date.now();

      const scannedAt = new Date().toISOString();
      const result: ScanResult = { rawValue: trimmed, format, scannedAt };
      onAcceptedRef.current(result);

      const entry: ContinuousScanEntry = {
        id: createEntryId(),
        code,
        rawValue: trimmed,
        format,
        scannedAt,
        lookupStatus: "pending",
        product: null,
        lookupError: null,
      };

      setEntries((prev) => {
        if (prev.some((item) => item.code === code)) {
          return prev;
        }
        return [entry, ...prev];
      });
      enqueueLookup(code);
    },
    [enqueueLookup, setCameraError, showDuplicateNotice],
  );

  const lookupActive = entries.some(
    (entry) =>
      entry.lookupStatus === "pending" || entry.lookupStatus === "loading",
  );

  return {
    entries,
    latestEntry: entries[0] ?? null,
    duplicateNotice,
    lookupActive,
    applyDecode,
    resetBatch,
  };
}
