/** @vitest-environment jsdom */
/**
 * スキャン一連フロー。子 hook は mock し、モード切替・手動入力・登録後クリアを確認する。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const start = vi.fn(async () => undefined);
const cancelOverlay = vi.fn(async () => undefined);
const closeOverlay = vi.fn(async () => undefined);
const setCameraError = vi.fn();
const lookup = vi.fn(async () => null);
const resetProductLookup = vi.fn();
const applyContinuousDecode = vi.fn();
const resetContinuousBatch = vi.fn();
const refreshListAndScroll = vi.fn();
const scrollToElementIdMock = vi.fn();

vi.mock("@/hooks/scan/use-barcode-camera", () => ({
  useBarcodeCamera: () => ({
    regionId: "reader",
    overlayOpen: false,
    scanning: false,
    starting: false,
    error: null,
    setError: setCameraError,
    start,
    stop: vi.fn(async () => undefined),
    cancelOverlay,
    closeOverlay,
  }),
}));

vi.mock("@/hooks/scan/use-body-scroll-lock", () => ({
  useBodyScrollLock: () => undefined,
}));

vi.mock("@/hooks/scan/use-product-lookup", () => ({
  useProductLookup: () => ({
    product: null,
    pending: false,
    error: null,
    lookup,
    lookupOnce: vi.fn(),
    reset: resetProductLookup,
  }),
}));

vi.mock("@/hooks/scan/use-continuous-scan", () => ({
  useContinuousScan: () => ({
    entries: [],
    latestEntry: null,
    duplicateNotice: null,
    lookupActive: false,
    applyDecode: applyContinuousDecode,
    resetBatch: resetContinuousBatch,
  }),
}));

vi.mock("@/hooks/scan/use-list-refresh-after-register", () => ({
  useListRefreshAfterRegister: () => ({
    listUpdating: false,
    refreshListAndScroll,
  }),
}));

vi.mock("@/lib/scan/scroll-to-element-id", () => ({
  scrollToElementId: (...args: unknown[]) => scrollToElementIdMock(...args),
}));

import type { FormEvent } from "react";
import { useBarcodeScanFlow } from "@/hooks/scan/use-barcode-scan-flow";

describe("useBarcodeScanFlow", () => {
  beforeEach(() => {
    start.mockClear();
    cancelOverlay.mockClear();
    closeOverlay.mockClear();
    setCameraError.mockClear();
    lookup.mockClear();
    resetProductLookup.mockClear();
    applyContinuousDecode.mockClear();
    resetContinuousBatch.mockClear();
    refreshListAndScroll.mockClear();
    scrollToElementIdMock.mockClear();
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
  });

  function submitEvent(): FormEvent<HTMLFormElement> {
    return {
      preventDefault: vi.fn(),
    } as unknown as FormEvent<HTMLFormElement>;
  }

  it("モード切替と手動入力（空はエラー、値ありは単体照会）", async () => {
    const { result } = renderHook(() => useBarcodeScanFlow());

    act(() => {
      result.current.selectScanMode("continuous");
    });
    expect(result.current.scanMode).toBe("continuous");

    act(() => {
      result.current.selectScanMode("single");
      result.current.setManualValue("   ");
    });

    act(() => {
      result.current.handleManualSubmit(submitEvent());
    });
    expect(setCameraError).toHaveBeenCalledWith(
      "照会する値を入力してください。",
    );

    act(() => {
      result.current.setManualValue("4901234567890");
    });
    await act(async () => {
      result.current.handleManualSubmit(submitEvent());
    });
    expect(lookup).toHaveBeenCalledWith("4901234567890");
  });

  it("連続モードの手動入力は continuous decode。登録後はクリアと refresh", async () => {
    const { result } = renderHook(() => useBarcodeScanFlow());

    act(() => {
      result.current.selectScanMode("continuous");
      result.current.setManualValue("4901234567890");
    });
    act(() => {
      result.current.handleManualSubmit(submitEvent());
    });
    expect(applyContinuousDecode).toHaveBeenCalledWith(
      "4901234567890",
      "MANUAL",
    );

    act(() => {
      result.current.afterRegistered();
    });
    expect(resetProductLookup).toHaveBeenCalled();
    expect(resetContinuousBatch).toHaveBeenCalled();
    expect(result.current.showEmptyList).toBe(true);
    expect(refreshListAndScroll).toHaveBeenCalledWith({ scrollToId: "items" });
  });

  it("連続モードの startScan はバッチをリセットしてからカメラ開始", async () => {
    const { result } = renderHook(() => useBarcodeScanFlow());

    act(() => {
      result.current.selectScanMode("continuous");
    });
    await act(async () => {
      await result.current.startScan();
    });
    expect(resetContinuousBatch).toHaveBeenCalled();
    expect(start).toHaveBeenCalled();
  });
});
