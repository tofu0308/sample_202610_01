/** @vitest-environment happy-dom */
/**
 * scan 系の葉 hooks を 1 ファイルにまとめ、DOM 環境の起動回数を減らす。
 * useBarcodeScanFlow は子 hook を mock するため別ファイル。
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useBarcodeCamera } from "@/hooks/scan/use-barcode-camera";
import { useBodyScrollLock } from "@/hooks/scan/use-body-scroll-lock";
import { useContinuousScan } from "@/hooks/scan/use-continuous-scan";
import { useListRefreshAfterRegister } from "@/hooks/scan/use-list-refresh-after-register";
import { useProductLookup } from "@/hooks/scan/use-product-lookup";
import { SAME_VALUE_COOLDOWN_MS } from "@/lib/scan/constants";

const refresh = vi.fn();
const scrollToElementIdMock = vi.fn();
const fetchProductLookup = vi.fn();
const startMock = vi.fn();
const stopMock = vi.fn();
const clearMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/scan/scroll-to-element-id", () => ({
  scrollToElementId: (...args: unknown[]) => scrollToElementIdMock(...args),
}));

vi.mock("@/lib/products/product-lookup-request", () => ({
  fetchProductLookup: (...args: unknown[]) => fetchProductLookup(...args),
}));

vi.mock("html5-qrcode", () => {
  class Html5Qrcode {
    isScanning = false;
    start = (...args: unknown[]) => {
      this.isScanning = true;
      return startMock(...args);
    };
    stop = (...args: unknown[]) => {
      this.isScanning = false;
      return stopMock(...args);
    };
    clear = (...args: unknown[]) => clearMock(...args);
  }
  return { Html5Qrcode };
});

async function flushFrames() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  });
}

describe("useListRefreshAfterRegister", () => {
  beforeEach(() => {
    refresh.mockReset();
    scrollToElementIdMock.mockReset();
  });

  it("既定では #items へスクロールし refresh する", () => {
    const { result } = renderHook(() => useListRefreshAfterRegister());

    act(() => {
      result.current.refreshListAndScroll();
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(scrollToElementIdMock).toHaveBeenCalledWith("items");
  });

  it("scrollToId を渡すとその id へスクロールする", () => {
    const { result } = renderHook(() => useListRefreshAfterRegister());

    act(() => {
      result.current.refreshListAndScroll({ scrollToId: "scan" });
    });

    expect(refresh).toHaveBeenCalledTimes(1);
    expect(scrollToElementIdMock).toHaveBeenCalledWith("scan");
  });
});

describe("useProductLookup", () => {
  beforeEach(() => {
    fetchProductLookup.mockReset();
  });

  it("成功時は product を載せ、失敗時は error", async () => {
    const { result } = renderHook(() => useProductLookup());
    const found = {
      found: true as const,
      code: "4901234567890",
      name: "塗料",
      source: "yahoo_shopping" as const,
    };

    fetchProductLookup.mockResolvedValue({ data: found, error: null });
    let returned: unknown;
    await act(async () => {
      returned = await result.current.lookup("4901234567890");
    });
    expect(returned).toEqual(found);
    expect(result.current.product).toEqual(found);
    expect(result.current.pending).toBe(false);

    fetchProductLookup.mockResolvedValue({
      data: null,
      error: "見つかりません",
    });
    await act(async () => {
      returned = await result.current.lookup("4900000000000");
    });
    expect(returned).toBeNull();
    expect(result.current.error).toBe("見つかりません");
    expect(result.current.product).toBeNull();
  });

  it("lookupOnce は state を変えず、reset でクリア", async () => {
    const { result } = renderHook(() => useProductLookup());
    fetchProductLookup.mockResolvedValue({
      data: {
        found: false,
        code: "1",
        source: "yahoo_shopping",
      },
      error: null,
    });

    await act(async () => {
      await result.current.lookupOnce("1");
    });
    expect(result.current.product).toBeNull();

    fetchProductLookup.mockResolvedValue({
      data: {
        found: true,
        code: "1",
        name: "A",
        source: "yahoo_shopping",
      },
      error: null,
    });
    await act(async () => {
      await result.current.lookup("1");
    });
    act(() => {
      result.current.reset();
    });
    expect(result.current.product).toBeNull();
    expect(result.current.error).toBeNull();
  });
});

describe("useBodyScrollLock", () => {
  it("locked 中は overflow:hidden、解除で元に戻す", () => {
    document.body.style.overflow = "auto";

    const { rerender, unmount } = renderHook(
      ({ locked }) => {
        useBodyScrollLock(locked);
      },
      { initialProps: { locked: true } },
    );

    expect(document.body.style.overflow).toBe("hidden");

    rerender({ locked: false });
    expect(document.body.style.overflow).toBe("auto");

    rerender({ locked: true });
    expect(document.body.style.overflow).toBe("hidden");
    unmount();
    expect(document.body.style.overflow).toBe("auto");
  });
});

describe("useContinuousScan", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderContinuous(lookupOnce = vi.fn()) {
    const setCameraError = vi.fn();
    const onAccepted = vi.fn();
    const hook = renderHook(() =>
      useContinuousScan({ lookupOnce, setCameraError, onAccepted }),
    );
    return { ...hook, setCameraError, onAccepted, lookupOnce };
  }

  it("不正 JAN はカメラエラー、空文字は無視", () => {
    const { result, setCameraError, onAccepted } = renderContinuous();

    act(() => {
      result.current.applyDecode("   ", undefined);
      result.current.applyDecode("abc", undefined);
    });
    expect(onAccepted).not.toHaveBeenCalled();
    expect(setCameraError).toHaveBeenCalledWith(
      expect.stringContaining("認識できませんでした"),
    );
  });

  it("新規はリスト追加と照会。同一バッチの再読取は重複通知", async () => {
    const lookupOnce = vi.fn().mockResolvedValue({
      data: {
        found: true,
        code: "4901234567890",
        name: "塗料",
        source: "yahoo_shopping",
      },
      error: null,
    });
    const { result, onAccepted } = renderContinuous(lookupOnce);

    await act(async () => {
      result.current.applyDecode("4901234567890", "EAN_13");
      await vi.runAllTimersAsync();
    });

    expect(onAccepted).toHaveBeenCalledOnce();
    expect(result.current.entries).toHaveLength(1);
    expect(result.current.entries[0]?.lookupStatus).toBe("done");
    expect(lookupOnce).toHaveBeenCalledWith("4901234567890");

    act(() => {
      result.current.applyDecode("4901234567890", "EAN_13");
    });
    expect(result.current.duplicateNotice).toBeNull();

    act(() => {
      vi.advanceTimersByTime(SAME_VALUE_COOLDOWN_MS);
      result.current.applyDecode("4901234567890", "EAN_13");
    });
    expect(result.current.duplicateNotice).toContain("重複");
    expect(result.current.entries).toHaveLength(1);
  });

  it("照会失敗は error。resetBatch で空に戻す", async () => {
    const lookupOnce = vi.fn().mockResolvedValue({
      data: null,
      error: "ネットワークエラー",
    });
    const { result } = renderContinuous(lookupOnce);

    await act(async () => {
      result.current.applyDecode("4901234567890", undefined);
      await vi.runAllTimersAsync();
    });
    expect(result.current.entries[0]?.lookupStatus).toBe("error");

    act(() => {
      result.current.resetBatch();
    });
    expect(result.current.entries).toHaveLength(0);
    expect(result.current.duplicateNotice).toBeNull();
  });

  it("照会中は lookupActive。複数 JAN を直列で積める", async () => {
    let resolveFirst!: (value: unknown) => void;
    const first = new Promise((resolve) => {
      resolveFirst = resolve;
    });
    const lookupOnce = vi
      .fn()
      .mockImplementationOnce(() => first)
      .mockResolvedValueOnce({
        data: {
          found: true,
          code: "4901111111111",
          name: "B",
          source: "yahoo_shopping",
        },
        error: null,
      });

    const { result } = renderContinuous(lookupOnce);
    await act(async () => {
      result.current.applyDecode("4901234567890", undefined);
      result.current.applyDecode("4901111111111", undefined);
    });
    expect(result.current.lookupActive).toBe(true);
    expect(result.current.entries).toHaveLength(2);

    await act(async () => {
      resolveFirst({
        data: {
          found: true,
          code: "4901234567890",
          name: "A",
          source: "yahoo_shopping",
        },
        error: null,
      });
      await vi.runAllTimersAsync();
    });
    expect(result.current.entries.every((e) => e.lookupStatus === "done")).toBe(
      true,
    );
    expect(result.current.lookupActive).toBe(false);
  });

  it("重複通知はタイマー後に消え、再通知で前タイマーを差し替える", async () => {
    const lookupOnce = vi.fn().mockResolvedValue({
      data: {
        found: true,
        code: "4901234567890",
        name: "塗料",
        source: "yahoo_shopping",
      },
      error: null,
    });
    const { result, unmount } = renderContinuous(lookupOnce);

    await act(async () => {
      result.current.applyDecode("4901234567890", undefined);
      await vi.runAllTimersAsync();
    });

    act(() => {
      vi.advanceTimersByTime(SAME_VALUE_COOLDOWN_MS);
      result.current.applyDecode("4901234567890", undefined);
    });
    expect(result.current.duplicateNotice).toContain("重複");

    act(() => {
      vi.advanceTimersByTime(SAME_VALUE_COOLDOWN_MS);
      result.current.applyDecode("4901234567890", undefined);
    });
    expect(result.current.duplicateNotice).toContain("重複");

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.duplicateNotice).toBeNull();

    act(() => {
      vi.advanceTimersByTime(SAME_VALUE_COOLDOWN_MS);
      result.current.applyDecode("4901234567890", undefined);
    });
    unmount();
  });
});

describe("useBarcodeCamera", () => {
  beforeEach(() => {
    startMock.mockReset();
    stopMock.mockReset();
    clearMock.mockReset();
    startMock.mockResolvedValue(undefined);
    stopMock.mockResolvedValue(undefined);
  });

  async function startCamera(
    onDecode: ReturnType<typeof vi.fn> = vi.fn(),
  ) {
    const hook = renderHook(() => useBarcodeCamera({ onDecode }));
    let startPromise: Promise<void>;
    act(() => {
      startPromise = hook.result.current.start();
    });
    await flushFrames();
    await act(async () => {
      await startPromise!;
    });
    return hook;
  }

  it("start 成功で scanning。cancel / close / stop(未起動) を扱う", async () => {
    const { result } = await startCamera();

    expect(result.current.overlayOpen).toBe(true);
    expect(result.current.scanning).toBe(true);
    expect(startMock).toHaveBeenCalled();

    const cameraConfig = startMock.mock.calls[0]?.[1] as {
      qrbox: (w: number, h: number) => { width: number; height: number };
    };
    expect(cameraConfig.qrbox(400, 800)).toEqual({ width: 320, height: 200 });

    await act(async () => {
      await result.current.closeOverlay();
    });
    expect(result.current.overlayOpen).toBe(false);

    await act(async () => {
      await result.current.stop();
    });
    expect(result.current.scanning).toBe(false);
  });

  it("環境カメラ失敗後にインカメ成功／両方失敗／読取コールバック", async () => {
    startMock
      .mockRejectedValueOnce(new Error("no env"))
      .mockResolvedValueOnce(undefined);

    const onDecode = vi.fn();
    const { result, unmount } = await startCamera(onDecode);
    expect(result.current.scanning).toBe(true);
    expect(startMock).toHaveBeenCalledTimes(2);

    const onSuccess = startMock.mock.calls.at(-1)?.[2] as (
      text: string,
      decoded: { result: { format?: { formatName?: string } } },
    ) => void;
    act(() => {
      onSuccess("4901234567890", {
        result: { format: { formatName: "EAN_13" } },
      });
    });
    expect(onDecode).toHaveBeenCalledWith({
      rawValue: "4901234567890",
      format: "EAN_13",
    });

    // フレーム未検出コールバック（空）も呼べる
    const onFailure = startMock.mock.calls.at(-1)?.[3] as () => void;
    onFailure();

    unmount();

    startMock.mockReset();
    startMock.mockRejectedValue(new Error("NotAllowedError"));
    const failed = await startCamera();
    expect(failed.result.current.error).toContain("許可されませんでした");
    expect(failed.result.current.overlayOpen).toBe(false);
  });
});
