/**
 * ページ内スクロールヘルパの UT。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollToElementId } from "@/lib/scan/scroll-to-element-id";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("scrollToElementId", () => {
  it("該当要素があれば scrollIntoView する", () => {
    const scrollIntoView = vi.fn();
    vi.stubGlobal(
      "document",
      {
        getElementById: vi.fn().mockReturnValue({ scrollIntoView }),
      } as unknown as Document,
    );
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    scrollToElementId("items");
    expect(document.getElementById).toHaveBeenCalledWith("items");
    expect(scrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "start",
    });
  });

  it("要素が無くても例外にしない", () => {
    vi.stubGlobal(
      "document",
      {
        getElementById: vi.fn().mockReturnValue(null),
      } as unknown as Document,
    );
    vi.stubGlobal("requestAnimationFrame", (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    });

    expect(() => scrollToElementId("missing")).not.toThrow();
  });
});
