/**
 * Profile 補完。Prisma は mock。P2002 は生成クライアントの実クラスで再現。
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { Prisma } from "@/generated/prisma/client";

const { findUnique, create } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    profile: { findUnique, create },
  },
}));

import { ensureProfileForAuthUser } from "@/lib/auth/ensure-profile";

beforeEach(() => {
  findUnique.mockReset();
  create.mockReset();
});

describe("ensureProfileForAuthUser", () => {
  it("既存 Profile があれば created: false", async () => {
    findUnique.mockResolvedValue({ username: "existing" });

    await expect(
      ensureProfileForAuthUser({ id: "uid-1" }),
    ).resolves.toEqual({
      ok: true,
      created: false,
      username: "existing",
    });
    expect(create).not.toHaveBeenCalled();
  });

  it("metadata の username が無ければ missing_username", async () => {
    findUnique.mockResolvedValue(null);

    await expect(
      ensureProfileForAuthUser({ id: "uid-1", user_metadata: {} }),
    ).resolves.toEqual({ ok: false, reason: "missing_username" });
  });

  it("無ければ create する", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({});

    await expect(
      ensureProfileForAuthUser({
        id: "uid-1",
        user_metadata: { username: "newbie" },
      }),
    ).resolves.toEqual({ ok: true, created: true, username: "newbie" });
  });

  it("P2002 は username_taken、その他は unknown", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("unique", {
        code: "P2002",
        clientVersion: "test",
      }),
    );

    await expect(
      ensureProfileForAuthUser({
        id: "uid-1",
        user_metadata: { username: "taken" },
      }),
    ).resolves.toEqual({ ok: false, reason: "username_taken" });

    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    create.mockRejectedValue(new Error("db down"));
    await expect(
      ensureProfileForAuthUser({
        id: "uid-1",
        user_metadata: { username: "other" },
      }),
    ).resolves.toEqual({ ok: false, reason: "unknown" });
    errorSpy.mockRestore();
  });
});
