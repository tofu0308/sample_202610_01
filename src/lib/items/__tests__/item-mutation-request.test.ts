/**
 * 単件更新・削除リクエストの UT。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { deleteItem, patchItem } from "@/lib/items/item-mutation-request";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("patchItem", () => {
  it("成功時は ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ item: {} }),
      }),
    );

    await expect(
      patchItem("id-1", { status1: "残少", note: "メモ" }),
    ).resolves.toEqual({ ok: true });
    expect(fetch).toHaveBeenCalledWith(
      "/api/items/id-1",
      expect.objectContaining({ method: "PATCH" }),
    );
  });

  it("API エラー時は message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "更新失敗" }),
      }),
    );

    await expect(patchItem("id-1", { status1: "残少" })).resolves.toEqual({
      ok: false,
      message: "更新失敗",
    });
  });

  it("ネットワーク失敗時は定型メッセージ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    await expect(patchItem("id-1", { note: "x" })).resolves.toEqual({
      ok: false,
      message: "ネットワークエラーが発生しました",
    });
  });
});

describe("deleteItem", () => {
  it("成功時は ok", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({}),
      }),
    );

    await expect(deleteItem("id-1")).resolves.toEqual({ ok: true });
  });

  it("API エラー時は message", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "削除失敗" }),
      }),
    );

    await expect(deleteItem("id-1")).resolves.toEqual({
      ok: false,
      message: "削除失敗",
    });
  });
});
