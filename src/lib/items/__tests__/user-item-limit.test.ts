/**
 * 登録件数上限の純関数 UT。
 */

import { afterEach, describe, expect, it } from "vitest";
import {
  countNewItemIncrement,
  DEFAULT_USER_ITEM_LIMIT,
  formatUserItemBulkLimitMessage,
  formatUserItemLimitReachedMessage,
  getUserItemLimit,
  getUserItemRemaining,
  isUserItemLimitExempt,
  wouldExceedUserItemLimit,
} from "@/lib/items/user-item-limit";

const ORIGINAL_LIMIT = process.env.USER_ITEM_LIMIT;
const ORIGINAL_ADMIN = process.env.ADMIN_EMAIL;

afterEach(() => {
  if (ORIGINAL_LIMIT === undefined) {
    delete process.env.USER_ITEM_LIMIT;
  } else {
    process.env.USER_ITEM_LIMIT = ORIGINAL_LIMIT;
  }
  if (ORIGINAL_ADMIN === undefined) {
    delete process.env.ADMIN_EMAIL;
  } else {
    process.env.ADMIN_EMAIL = ORIGINAL_ADMIN;
  }
});

describe("getUserItemLimit", () => {
  it("未設定なら既定 10", () => {
    delete process.env.USER_ITEM_LIMIT;
    expect(getUserItemLimit()).toBe(DEFAULT_USER_ITEM_LIMIT);
  });

  it("env の正の整数を使う。不正値は既定", () => {
    process.env.USER_ITEM_LIMIT = "100";
    expect(getUserItemLimit()).toBe(100);
    process.env.USER_ITEM_LIMIT = "0";
    expect(getUserItemLimit()).toBe(DEFAULT_USER_ITEM_LIMIT);
    process.env.USER_ITEM_LIMIT = "abc";
    expect(getUserItemLimit()).toBe(DEFAULT_USER_ITEM_LIMIT);
  });
});

describe("isUserItemLimitExempt", () => {
  it("ADMIN_EMAIL と一致すれば true（大小無視）", () => {
    process.env.ADMIN_EMAIL = "Admin@Example.com";
    expect(isUserItemLimitExempt("admin@example.com")).toBe(true);
    expect(isUserItemLimitExempt("other@example.com")).toBe(false);
    expect(isUserItemLimitExempt(null)).toBe(false);
  });
});

describe("countNewItemIncrement / wouldExceed", () => {
  it("所持済みと重複コードは増分に入れない", () => {
    const owned = new Set(["a", "b"]);
    expect(countNewItemIncrement(["a", "c", "c", "d"], owned)).toBe(2);
    expect(countNewItemIncrement(["a", "b"], owned)).toBe(0);
  });

  it("残り枠を超えるか", () => {
    expect(wouldExceedUserItemLimit(8, 3, 10)).toBe(true);
    expect(wouldExceedUserItemLimit(8, 2, 10)).toBe(false);
    expect(wouldExceedUserItemLimit(10, 1, 10)).toBe(true);
    expect(wouldExceedUserItemLimit(10, 0, 10)).toBe(false);
  });
});

describe("messages / remaining", () => {
  it("文言に件数を載せる", () => {
    expect(formatUserItemLimitReachedMessage(10)).toContain("10件");
    expect(
      formatUserItemBulkLimitMessage({
        limit: 10,
        currentCount: 8,
        newIncrement: 3,
      }),
    ).toMatch(/あと 2 件/);
  });

  it("残り枠。無制限は null", () => {
    expect(getUserItemRemaining(3, 10, false)).toBe(7);
    expect(getUserItemRemaining(12, 10, false)).toBe(0);
    expect(getUserItemRemaining(3, 10, true)).toBeNull();
  });
});
