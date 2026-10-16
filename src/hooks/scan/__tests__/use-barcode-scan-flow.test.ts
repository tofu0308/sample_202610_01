/** @vitest-environment happy-dom */
/**
 * スキャン一連フロー。子 hook は mock し、モード切替・手動入力・登録後クリアを確認する。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const start = vi.fn(async () => undefined);
const stop = vi.fn(async () => undefined);
const cancelOverlay = vi.fn(async () => undefined);
const closeOverlay = vi.fn(async () => undefined);
const setCameraError = vi.fn();
const lookup = vi.fn(async () => null);
const resetProductLookup = vi.fn();
const applyContinuousDecode = vi.fn();
const resetContinuousBatch = vi.fn();
const refreshListAndScroll = vi.fn();
const scrollToElementIdMock = vi.fn();

const cameraState = {
  overlayOpen: false,
  starting: false,
};

const continuousState = {
  entries: [] as { id: string }[],
};

const mediaListeners: Array<(event: MediaQueryListEvent) => void> = [];
const mediaQuery = {
  matches: false,
  media: "(min-width: 768px)",
  addEventListener: (
    _type: string,
    listener: (event: MediaQueryListEvent) => void,
  ) => {
    mediaListeners.push(listener);
  },
  removeEventListener: vi.fn(),
};

vi.mock("@/hooks/scan/use-barcode-camera", () => ({
  useBarcodeCamera: (options: {
    onDecode: (payload: { rawValue: string; format?: string }) => void;
  }) => {
    // テストから decode を起こせるよう保持
    (globalThis as { __scanOnDecode?: typeof options.onDecode }).__scanOnDecode =
      options.onDecode;
    return {
      regionId: "reader",
      overlayOpen: cameraState.overlayOpen,
      scanning: false,
      starting: cameraState.starting,
      error: null,
      setError: setCameraError,
      start,
      stop,
      cancelOverlay,
      closeOverlay,
    };
  },
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
    entries: continuousState.entries,
    latestEntry: continuousState.entries[0] ?? null,
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
import { SAME_VALUE_COOLDOWN_MS } from "@/lib/scan/constants";

describe("useBarcodeScanFlow", () => {
  beforeEach(() => {
    start.mockClear();
    stop.mockClear();
    cancelOverlay.mockClear();
    closeOverlay.mockClear();
    setCameraError.mockClear();
    lookup.mockClear();
    resetProductLookup.mockClear();
    applyContinuousDecode.mockClear();
    resetContinuousBatch.mockClear();
    refreshListAndScroll.mockClear();
    scrollToElementIdMock.mockClear();
    cameraState.overlayOpen = false;
    cameraState.starting = false;
    continuousState.entries = [];
    mediaListeners.length = 0;
    mediaQuery.matches = false;
    vi.stubGlobal("matchMedia", () => mediaQuery);
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

  it("overlay 中はモード切替しない。dismiss / finish / md 幅で閉じる", async () => {
    const { result, rerender } = renderHook(() => useBarcodeScanFlow());

    cameraState.overlayOpen = true;
    rerender();
    act(() => {
      result.current.selectScanMode("continuous");
    });
    expect(result.current.scanMode).toBe("single");

    cameraState.overlayOpen = false;
    rerender();

    await act(async () => {
      await result.current.dismissOverlayToResults();
    });
    expect(closeOverlay).toHaveBeenCalled();
    expect(scrollToElementIdMock).toHaveBeenCalledWith("product-lookup");

    continuousState.entries = [];
    rerender();
    await act(async () => {
      await result.current.finishContinuousScan();
    });
    expect(result.current.showEmptyList).toBe(true);
    expect(scrollToElementIdMock).toHaveBeenCalledWith("continuous-scan-list");

    continuousState.entries = [{ id: "1" }];
    act(() => {
      result.current.selectScanMode("continuous");
    });
    // showEmptyList はモード切替で false に戻る
    expect(result.current.showEmptyList).toBe(false);
    await act(async () => {
      await result.current.finishContinuousScan();
    });
    expect(result.current.showEmptyList).toBe(false);

    act(() => {
      mediaQuery.matches = true;
      for (const listener of mediaListeners) {
        listener({ matches: true } as MediaQueryListEvent);
      }
    });
    expect(cancelOverlay).toHaveBeenCalled();
  });

  it("単体のカメラ読取は stop+lookup。cooldown と空文字は無視", async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useBarcodeScanFlow());
    const onDecode = (globalThis as {
      __scanOnDecode?: (payload: { rawValue: string; format?: string }) => void;
    }).__scanOnDecode;
    expect(onDecode).toBeTypeOf("function");

    await act(async () => {
      onDecode?.({ rawValue: "   ", format: "EAN_13" });
    });
    expect(lookup).not.toHaveBeenCalled();

    await act(async () => {
      onDecode?.({ rawValue: "4901234567890", format: "EAN_13" });
    });
    expect(stop).toHaveBeenCalled();
    expect(lookup).toHaveBeenCalledWith("4901234567890");

    await act(async () => {
      onDecode?.({ rawValue: "4901234567890", format: "EAN_13" });
    });
    expect(lookup).toHaveBeenCalledTimes(1);

    await act(async () => {
      vi.advanceTimersByTime(SAME_VALUE_COOLDOWN_MS);
      onDecode?.({ rawValue: "4901234567890", format: "EAN_13" });
    });
    expect(lookup).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});
