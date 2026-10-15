import { describe, expect, it } from "vitest";
import { toLoginErrorMessage } from "@/lib/auth/login-error-message";

describe("toLoginErrorMessage", () => {
  it("認証失敗はメール／パスワードのどちらとも言わない", () => {
    expect(
      toLoginErrorMessage({ message: "Invalid login credentials" }),
    ).toBe("メールまたはパスワードが正しくありません。");
  });

  it("未確認メールを案内する", () => {
    expect(
      toLoginErrorMessage({ message: "Email not confirmed" }),
    ).toContain("確認");
  });

  it("未知の失敗は汎用文言にする", () => {
    expect(toLoginErrorMessage({ message: "Something weird" })).toBe(
      "ログインに失敗しました。",
    );
  });
});
