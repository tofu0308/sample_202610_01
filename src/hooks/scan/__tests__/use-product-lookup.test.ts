/** @vitest-environment jsdom */
/**
 * 照会 hook。fetchProductLookup を mock。
 */

import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useProductLookup } from "@/hooks/scan/use-product-lookup";

const fetchProductLookup = vi.fn();

vi.mock("@/lib/products/product-lookup-request", () => ({
  fetchProductLookup: (...args: unknown[]) => fetchProductLookup(...args),
}));

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
