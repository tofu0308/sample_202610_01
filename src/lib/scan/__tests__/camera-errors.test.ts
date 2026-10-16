import { describe, expect, it } from "vitest";
import { toCameraFriendlyError } from "@/lib/scan/camera-errors";

describe("toCameraFriendlyError", () => {
  it("権限拒否を案内文にする", () => {
    expect(toCameraFriendlyError(new Error("NotAllowedError"))).toContain(
      "許可されませんでした",
    );
    expect(toCameraFriendlyError("Permission denied")).toContain("許可");
  });

  it("カメラ未検出・非対応を案内文にする", () => {
    expect(toCameraFriendlyError(new Error("NotFoundError"))).toContain(
      "見つかりませんでした",
    );
    expect(toCameraFriendlyError(new Error("NotSupportedError"))).toContain(
      "HTTPS",
    );
  });

  it("未知エラーはメッセージをそのまま（空なら既定文）", () => {
    expect(toCameraFriendlyError(new Error("weird"))).toBe("weird");
    expect(toCameraFriendlyError("")).toBe("カメラの起動に失敗しました。");
  });
});
