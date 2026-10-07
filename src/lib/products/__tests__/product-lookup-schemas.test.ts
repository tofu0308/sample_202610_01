/**
 * productLookupSchema のユニットテスト。
 * 数字以外の除去と桁数チェックが境界で効くことを確認する。
 */

import { describe, expect, it } from "vitest";
import { productLookupSchema } from "@/lib/products/product-lookup-schemas";

describe("productLookupSchema", () => {
  it("accepts a 13-digit JAN", () => {
    const parsed = productLookupSchema.safeParse({ code: "4905524535815" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("4905524535815");
    }
  });

  it("strips non-digits", () => {
    const parsed = productLookupSchema.safeParse({ code: "4905-5245-35815" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("4905524535815");
    }
  });

  it("rejects too-short codes", () => {
    const parsed = productLookupSchema.safeParse({ code: "12345" });
    expect(parsed.success).toBe(false);
  });
});
