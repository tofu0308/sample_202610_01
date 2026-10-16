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

  it("403 は limit（本文の error を使う）", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 403,
        json: async () => ({
          error: "登録上限（10件）に達しています。不要な登録を削除してから追加してください。",
        }),
      }),
    );

    const result = await postRegisterItem(product);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.kind).toBe("limit");
      expect(result.message).toContain("登録上限");
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

  it("API エラーは本文の error、無ければ定型文。任意フィールドは省略可", async () => {
    const minimal: FoundProduct = {
      found: true,
      code: "4900000000000",
      name: "最小",
      source: "yahoo_shopping",
    };
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "サーバエラー" }),
    });
    vi.stubGlobal("fetch", fetchMock);

    await expect(postRegisterItem(minimal)).resolves.toEqual({
      ok: false,
      kind: "error",
      message: "サーバエラー",
    });
    const body = JSON.parse(
      (fetchMock.mock.calls[0]?.[1] as { body: string }).body,
    ) as Record<string, unknown>;
    expect(body).not.toHaveProperty("brandName");
    expect(body).not.toHaveProperty("imageUrl");

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 500,
        json: async () => ({}),
      }),
    );
    await expect(postRegisterItem(minimal)).resolves.toMatchObject({
      ok: false,
      kind: "error",
      message: "登録に失敗しました",
    });
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

  it("API エラー時は message。JSON 失敗時は定型文", async () => {
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

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("bad json");
        },
      }),
    );
    await expect(postRegisterItemsBulk([product])).resolves.toEqual({
      ok: false,
      message: "一括登録に失敗しました",
    });
  });

  it("ネットワーク失敗時は定型メッセージ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );
    await expect(postRegisterItemsBulk([product])).resolves.toEqual({
      ok: false,
      message: "ネットワークエラーが発生しました",
    });
  });
});
