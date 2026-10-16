/** @vitest-environment jsdom */

import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useBodyScrollLock } from "@/hooks/scan/use-body-scroll-lock";

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
