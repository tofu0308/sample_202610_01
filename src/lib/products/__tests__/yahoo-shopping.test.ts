/**
 * Yahoo 照会ラッパ。実 HTTP は出さず fetch を mock する。
 */

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const fetchMock = vi.fn();
vi.stubGlobal("fetch", fetchMock);

import {
  lookupProductByJan,
  YahooShoppingConfigError,
  YahooShoppingRequestError,
} from "@/lib/products/yahoo-shopping";

describe("lookupProductByJan", () => {
  beforeEach(() => {
    fetchMock.mockReset();
    process.env.YAHOO_APP_ID = "test-app-id";
  });

  afterEach(() => {
    delete process.env.YAHOO_APP_ID;
  });

  it("APP_ID 未設定は ConfigError", async () => {
    delete process.env.YAHOO_APP_ID;
    await expect(lookupProductByJan("4901234567890")).rejects.toBeInstanceOf(
      YahooShoppingConfigError,
    );
  });

  it("ヒット時は先頭商品を返す", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({
        totalResultsAvailable: 2,
        hits: [
          {
            name: "塗料A",
            image: { medium: "https://example.com/m.jpg" },
            brand: { name: "Brand" },
          },
        ],
      }),
    });

    const result = await lookupProductByJan("4901234567890");
    expect(result).toEqual({
      found: true,
      code: "4901234567890",
      name: "塗料A",
      imageUrl: "https://example.com/m.jpg",
      brandName: "Brand",
      source: "yahoo_shopping",
    });
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("未ヒットは found: false", async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ totalResultsAvailable: 0, hits: [] }),
    });

    await expect(lookupProductByJan("4900000000000")).resolves.toEqual({
      found: false,
      code: "4900000000000",
      source: "yahoo_shopping",
    });
  });

  it("HTTP 失敗は RequestError", async () => {
    fetchMock.mockResolvedValue({
      ok: false,
      status: 503,
      text: async () => "busy",
    });

    await expect(lookupProductByJan("4901234567890")).rejects.toMatchObject({
      name: "YahooShoppingRequestError",
      status: 503,
    });
    await expect(lookupProductByJan("4901234567890")).rejects.toBeInstanceOf(
      YahooShoppingRequestError,
    );
  });
});
