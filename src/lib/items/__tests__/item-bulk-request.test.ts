/**
 * 一括更新・削除リクエストの UT。
 * 実 API は使わず fetch をモックする。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteItemsBulk,
  patchItemsBulk,
} from "@/lib/items/item-bulk-request";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("patchItemsBulk", () => {
  it("成功時は updated を affected に載せる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ requested: 2, updated: 2, skipped: 0 }),
      }),
    );

    const result = await patchItemsBulk(["a", "b"], "残少");
    expect(result).toEqual({
      ok: true,
      requested: 2,
      affected: 2,
      skipped: 0,
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/items/bulk",
      expect.objectContaining({
        method: "PATCH",
        body: JSON.stringify({ ids: ["a", "b"], status1: "残少" }),
      }),
    );
  });

  it("API エラー時は message を返す", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => ({ error: "更新できませんでした" }),
      }),
    );

    const result = await patchItemsBulk(["a"], "残少");
    expect(result).toEqual({
      ok: false,
      message: "更新できませんでした",
    });
  });

  it("ネットワーク失敗時は定型メッセージ", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("offline")),
    );

    const result = await patchItemsBulk(["a"], "残少");
    expect(result).toEqual({
      ok: false,
      message: "ネットワークエラーが発生しました",
    });
  });
});

describe("deleteItemsBulk", () => {
  it("成功時は deleted を affected に載せる", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ requested: 3, deleted: 2, skipped: 1 }),
      }),
    );

    const result = await deleteItemsBulk(["a", "b", "c"]);
    expect(result).toEqual({
      ok: true,
      requested: 3,
      affected: 2,
      skipped: 1,
    });
    expect(fetch).toHaveBeenCalledWith(
      "/api/items/bulk",
      expect.objectContaining({
        method: "DELETE",
        body: JSON.stringify({ ids: ["a", "b", "c"] }),
      }),
    );
  });

  it("API エラー時は fallback メッセージも使える", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        json: async () => {
          throw new Error("not json");
        },
      }),
    );

    const result = await deleteItemsBulk(["a"]);
    expect(result).toEqual({
      ok: false,
      message: "一括削除に失敗しました",
    });
  });
});
