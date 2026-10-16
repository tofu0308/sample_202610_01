/** @vitest-environment jsdom */
/**
 * カメラ hook。html5-qrcode を mock し、開始成功／失敗・閉じるを確認する。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const startMock = vi.fn();
const stopMock = vi.fn();
const clearMock = vi.fn();

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

import { useBarcodeCamera } from "@/hooks/scan/use-barcode-camera";

async function flushFrames() {
  await act(async () => {
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => resolve());
      });
    });
  });
}

describe("useBarcodeCamera", () => {
  beforeEach(() => {
    startMock.mockReset();
    stopMock.mockReset();
    clearMock.mockReset();
    startMock.mockResolvedValue(undefined);
    stopMock.mockResolvedValue(undefined);
  });

  it("start 成功で scanning。cancel で閉じる", async () => {
    const { result } = renderHook(() =>
      useBarcodeCamera({ onDecode: vi.fn() }),
    );

    let startPromise: Promise<void>;
    act(() => {
      startPromise = result.current.start();
    });
    await flushFrames();
    await act(async () => {
      await startPromise!;
    });

    expect(result.current.overlayOpen).toBe(true);
    expect(result.current.scanning).toBe(true);
    expect(startMock).toHaveBeenCalled();

    await act(async () => {
      await result.current.cancelOverlay();
    });
    expect(result.current.overlayOpen).toBe(false);
    expect(result.current.scanning).toBe(false);
  });

  it("環境カメラ失敗後にインカメも失敗すると友好エラー", async () => {
    startMock.mockRejectedValue(new Error("NotAllowedError"));
    const { result } = renderHook(() =>
      useBarcodeCamera({ onDecode: vi.fn() }),
    );

    let startPromise: Promise<void>;
    act(() => {
      startPromise = result.current.start();
    });
    await flushFrames();
    await act(async () => {
      await startPromise!;
    });

    expect(result.current.error).toContain("許可されませんでした");
    expect(result.current.overlayOpen).toBe(false);
    expect(result.current.scanning).toBe(false);
  });
});
