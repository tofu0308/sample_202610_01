/**
 * 連続スキャン行 ID 生成の UT。
 */

import { describe, expect, it } from "vitest";
import { createEntryId } from "@/lib/scan/create-entry-id";

describe("createEntryId", () => {
  it("空でない文字列を返す", () => {
    const id = createEntryId();
    expect(typeof id).toBe("string");
    expect(id.length).toBeGreaterThan(0);
  });

  it("連続呼び出しで異なる値になりやすい", () => {
    const a = createEntryId();
    const b = createEntryId();
    expect(a).not.toBe(b);
  });
});
