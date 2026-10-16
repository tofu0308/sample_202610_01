/**
 * 登録上限の UI 判定 UT。
 */

import { describe, expect, it } from "vitest";
import {
  bulkRegisterLimitHint,
  formatItemCountLabel,
  isBulkRegisterBlockedByLimit,
  isRegisterBlockedByLimit,
  registerLimitHint,
  type ItemLimitView,
} from "@/lib/items/item-limit-view";

const base: ItemLimitView = {
  currentCount: 8,
  limit: 10,
  unlimited: false,
  ownedJans: ["a", "b"],
};

describe("item-limit-view", () => {
  it("単件: 上限到達で block。無制限はしない", () => {
    expect(isRegisterBlockedByLimit({ ...base, currentCount: 10 })).toBe(true);
    expect(registerLimitHint({ ...base, currentCount: 10 })).toContain("10件");
    expect(
      isRegisterBlockedByLimit({ ...base, currentCount: 10, unlimited: true }),
    ).toBe(false);
  });

  it("一括: 新規増分だけ見て枠不足を判定（所持済みは増分外）", () => {
    // 所持 a,b + 新規 c,d,e = 増分 3、残り 2 → block
    expect(isBulkRegisterBlockedByLimit(base, ["a", "c", "d", "e"])).toBe(true);
    expect(bulkRegisterLimitHint(base, ["a", "c", "d", "e"])).toMatch(/新規 3/);
    // 新規 2 なら OK
    expect(isBulkRegisterBlockedByLimit(base, ["a", "c", "d"])).toBe(false);
    expect(bulkRegisterLimitHint(base, ["a", "c", "d"])).toBeNull();
  });

  it("見出しラベル", () => {
    expect(formatItemCountLabel(base)).toBe("8 / 10");
    expect(formatItemCountLabel({ ...base, unlimited: true })).toBe(
      "8 件（制限なし）",
    );
  });
});
