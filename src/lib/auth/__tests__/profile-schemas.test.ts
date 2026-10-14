/**
 * profile-schemas のユニットテスト。
 * username の必須・正規化・文字種を確認する。
 */

import { describe, expect, it } from "vitest";
import { usernameSchema } from "@/lib/auth/profile-schemas";

describe("usernameSchema", () => {
  it("英数字とアンダースコアなら成功し、小文字に揃える", () => {
    const parsed = usernameSchema.safeParse("Isisa_01");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toBe("isisa_01");
    }
  });

  it("前後の空白を除去する", () => {
    const parsed = usernameSchema.safeParse("  demo  ");
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data).toBe("demo");
    }
  });

  it("空や空白のみは拒否する", () => {
    expect(usernameSchema.safeParse("").success).toBe(false);
    expect(usernameSchema.safeParse("   ").success).toBe(false);
  });

  it("短すぎる／長すぎるは拒否する", () => {
    expect(usernameSchema.safeParse("ab").success).toBe(false);
    expect(usernameSchema.safeParse("a".repeat(21)).success).toBe(false);
  });

  it("記号や日本語は拒否する", () => {
    expect(usernameSchema.safeParse("user-name").success).toBe(false);
    expect(usernameSchema.safeParse("ユーザー").success).toBe(false);
  });
});
