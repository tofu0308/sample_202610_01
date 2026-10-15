/**
 * 登録リクエスト（単件・一括）の UT。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  postRegisterItem,
  postRegisterItemsBulk,
  type FoundProduct,
} from "@/lib/items/register-item-request";

const product: FoundProduct = {
  found: true,
  code: "4901234567890",
  name: "テスト塗料",
  source: "yahoo_shopping",
  brandName: "Brand",
  imageUrl: "https://example.com/a.jpg",
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("postRegisterItem", () => {
  it("成功時は ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 201,
        json: async () => ({ item: { id: "1" } }),
      }),
    );

    await expect(postRegisterItem(product)).resolves.toEqual({ ok: true });
  });

  it("409 は duplicate", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 409,
        json: async () => ({ error: "Duplicate" }),
      }),
    );

    const result = await postRegisterItem(product);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("duplicate");
    }
  });

  it("ネットワーク失敗時は network", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    const result = await postRegisterItem(product);
    expect(result).toMatchObject({ ok: false, kind: "network" });
  });
});

describe("postRegisterItemsBulk", () => {
  it("成功時は件数サマリを返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          created: 2,
          duplicates: 1,
          failed: 0,
          requested: 3,
        }),
      }),
    );

    const result = await postRegisterItemsBulk([product, product]);
    expect(result).toEqual({
      ok: true,
      created: 2,
      duplicates: 1,
      failed: 0,
      requested: 3,
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/items/bulk",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("API エラー時は message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "一括登録できません" }),
      }),
    );

    await expect(postRegisterItemsBulk([product])).resolves.toEqual({
      ok: false,
      message: "一括登録できません",
    });
  });
});
