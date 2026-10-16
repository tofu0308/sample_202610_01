import { describe, expect, it } from "vitest";
import { safeNextPath } from "@/lib/auth/safe-next-path";

describe("safeNextPath", () => {
  it("未指定・不正は /", () => {
    expect(safeNextPath(undefined)).toBe("/");
    expect(safeNextPath("")).toBe("/");
    expect(safeNextPath("https://evil.example/")).toBe("/");
    expect(safeNextPath("//evil.example")).toBe("/");
  });

  it("通常の同一オリジンパスはそのまま", () => {
    expect(safeNextPath("/")).toBe("/");
    expect(safeNextPath("/?x=1")).toBe("/?x=1");
    expect(safeNextPath("/items")).toBe("/items");
  });

  it("/logout・/api・/auth はホームへ", () => {
    expect(safeNextPath("/logout")).toBe("/");
    expect(safeNextPath("/logout?x=1")).toBe("/");
    expect(safeNextPath("/api/items")).toBe("/");
    expect(safeNextPath("/auth/callback")).toBe("/");
  });
});
