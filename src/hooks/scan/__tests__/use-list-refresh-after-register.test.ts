/** @vitest-environment jsdom */
/**
 * 登録後の一覧反映。router.refresh とスクロール先だけを検証する。
 * useTransition の pending 表示は環境依存のためここでは見ない。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useListRefreshAfterRegister } from "@/hooks/scan/use-list-refresh-after-register";

const refresh = vi.fn();
const scrollToElementIdMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

vi.mock("@/lib/scan/scroll-to-element-id", () => ({
  scrollToElementId: (...args: unknown[]) => scrollToElementIdMock(...args),
}));

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
