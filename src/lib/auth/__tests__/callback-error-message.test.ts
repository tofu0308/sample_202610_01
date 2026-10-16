/**
 * callback ?error= の表示文言マッピング。
 */

import { describe, expect, it } from "vitest";
import { toCallbackErrorMessage } from "@/lib/auth/callback-error-message";

describe("toCallbackErrorMessage", () => {
  it("既知のキーは日本語メッセージにする", () => {
    expect(toCallbackErrorMessage("auth_callback_failed")).toContain(
      "確認リンク",
    );
    expect(toCallbackErrorMessage("profile_missing_username")).toContain(
      "ユーザーIDの情報",
    );
    expect(toCallbackErrorMessage("profile_username_taken")).toContain(
      "ユーザーID",
    );
    expect(toCallbackErrorMessage("profile_unknown")).toContain("プロフィール");
  });

  it("未知・未指定は null", () => {
    expect(toCallbackErrorMessage(undefined)).toBeNull();
    expect(toCallbackErrorMessage("something_else")).toBeNull();
  });
});
