/** @vitest-environment jsdom */
/**
 * 連続スキャン: JAN 排他・重複通知・照会キュー。
 */

import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useContinuousScan } from "@/hooks/scan/use-continuous-scan";
import { SAME_VALUE_COOLDOWN_MS } from "@/lib/scan/constants";

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

    // 同一コードの連続は cooldown 内では通知を出さない
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
});
