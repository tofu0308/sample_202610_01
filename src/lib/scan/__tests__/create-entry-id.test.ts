/**
 * 連続スキャン行 ID 生成の UT。
 * crypto.randomUUID がある場合と無い場合の両方を通す。
 */

import { afterEach, describe, expect, it, vi } from "vitest";
import { createEntryId } from "@/lib/scan/create-entry-id";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createEntryId", () => {
  it("randomUUID があればそれを使う", () => {
    vi.stubGlobal("crypto", {
      randomUUID: () => "uuid-fixed",
    });
    expect(createEntryId()).toBe("uuid-fixed");
  });

  it("randomUUID が無ければ Date+random のフォールバック", () => {
    vi.stubGlobal("crypto", {});
    const id = createEntryId();
    expect(typeof id).toBe("string");
    expect(id).toMatch(/^\d+-[a-z0-9]+$/i);
  });

  it("連続呼び出しで異なる値になりやすい（フォールバック）", () => {
    vi.stubGlobal("crypto", {});
    expect(createEntryId()).not.toBe(createEntryId());
  });
});
