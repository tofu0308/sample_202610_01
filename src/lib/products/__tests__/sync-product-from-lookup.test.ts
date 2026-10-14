/**
 * Product マスタ同期の UT。
 * 実 Yahoo / 実 DB は使わず、照会結果オブジェクトと upsert モックで検証する。
 */

import { describe, expect, it, vi } from "vitest";
import {
  syncProductFromLookupResult,
  toProductUpsertArgs,
} from "@/lib/products/sync-product-from-lookup";
import type { ProductLookupResult } from "@/lib/scan/types";

const found: Extract<ProductLookupResult, { found: true }> = {
  found: true,
  code: "4901234567890",
  name: "新しい商品名",
  brandName: "Brand",
  imageUrl: "https://example.com/a.jpg",
  source: "yahoo_shopping",
};

const notFound: Extract<ProductLookupResult, { found: false }> = {
  found: false,
  code: "4901234567890",
  source: "yahoo_shopping",
};

describe("toProductUpsertArgs", () => {
  it("create と update の両方に表示用フィールドを載せる", () => {
    const args = toProductUpsertArgs(found);
    expect(args.where).toEqual({ jan: found.code });
    expect(args.create).toMatchObject({
      jan: found.code,
      name: found.name,
      brandName: found.brandName,
      imageUrl: found.imageUrl,
      source: "yahoo_shopping",
    });
    expect(args.update).toEqual({
      name: found.name,
      brandName: found.brandName,
      imageUrl: found.imageUrl,
      source: "yahoo_shopping",
    });
  });

  it("省略フィールドは null にする", () => {
    const args = toProductUpsertArgs({
      found: true,
      code: "4901234567890",
      name: "名前のみ",
      source: "yahoo_shopping",
    });
    expect(args.update.brandName).toBeNull();
    expect(args.update.imageUrl).toBeNull();
  });
});

describe("syncProductFromLookupResult", () => {
  it("found:false なら upsert しない", async () => {
    const upsert = vi.fn();
    const status = await syncProductFromLookupResult(notFound, upsert);
    expect(status).toBe("skipped");
    expect(upsert).not.toHaveBeenCalled();
  });

  it("found:true なら upsert に正しい引数を渡す", async () => {
    const upsert = vi.fn().mockResolvedValue({});
    const status = await syncProductFromLookupResult(found, upsert);
    expect(status).toBe("synced");
    expect(upsert).toHaveBeenCalledTimes(1);
    expect(upsert).toHaveBeenCalledWith(toProductUpsertArgs(found));
  });
});
