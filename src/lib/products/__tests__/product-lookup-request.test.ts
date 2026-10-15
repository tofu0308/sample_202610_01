/**
 * 商品照会リクエストの UT。
 * 実 API は使わず fetch をモックして、成功／API エラー／ネットワークを分ける。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchProductLookup } from "@/lib/products/product-lookup-request";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchProductLookup", () => {
  it("成功時は data を返し error は null", async () => {
    const payload = {
      found: true,
      code: "4901234567890",
      name: "テスト商品",
      source: "yahoo_shopping",
    };
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => payload,
      }),
    );

    const result = await fetchProductLookup("4901234567890");
    expect(result.error).toBeNull();
    expect(result.data).toEqual(payload);
    expect(fetch).toHaveBeenCalledWith(
      "/api/products/lookup",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ code: "4901234567890" }),
      }),
    );
  });

  it("API エラー時は message を error に載せる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "照会できませんでした" }),
      }),
    );

    const result = await fetchProductLookup("4901234567890");
    expect(result.data).toBeNull();
    expect(result.error).toBe("照会できませんでした");
  });

  it("ネットワーク失敗時は定型メッセージ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    const result = await fetchProductLookup("4901234567890");
    expect(result.data).toBeNull();
    expect(result.error).toBe(
      "商品情報の取得中にネットワークエラーが発生しました",
    );
  });
});
