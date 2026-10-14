/**
 * throwAppError / 表示文言のユニットテスト。
 */

import { describe, expect, it } from "vitest";
import {
  AppError,
  getAppErrorPresentation,
  isAppError,
  throwAppError,
} from "@/lib/errors/app-error";

describe("throwAppError", () => {
  it("コード指定なら AppError になり、既定文言を持つ", () => {
    expect(() => throwAppError("invalid_operation")).toThrow(AppError);
    try {
      throwAppError("invalid_operation");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.code).toBe("invalid_operation");
        expect(error.message).toContain("不正な操作");
      }
    }
  });

  it("任意文言でも AppError になる", () => {
    try {
      throwAppError("確認用のエラー");
    } catch (error) {
      expect(isAppError(error)).toBe(true);
      if (isAppError(error)) {
        expect(error.message).toBe("確認用のエラー");
        expect(error.code).toBeUndefined();
      }
    }
  });
});

describe("getAppErrorPresentation", () => {
  it("AppError は意図的エラー用の見出しになる", () => {
    const view = getAppErrorPresentation(
      new AppError("停止しました", { code: "forbidden" }),
    );
    expect(view.intentional).toBe(true);
    expect(view.title).toContain("操作を完了できません");
    expect(view.description).toBe("停止しました");
  });

  it("通常の Error は想定外用の見出しになる", () => {
    const view = getAppErrorPresentation(new Error("db down"));
    expect(view.intentional).toBe(false);
    expect(view.title).toContain("表示中に問題");
  });
});
