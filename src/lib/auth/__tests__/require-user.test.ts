/**
 * 認可ヘルパ。Supabase / Profile / redirect は mock。
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const getUser = vi.fn();
const ensureProfileForAuthUser = vi.fn();
const redirect = vi.fn((path: string) => {
  throw new Error(`REDIRECT:${path}`);
});

vi.mock("@/lib/supabase/server", () => ({
  createClient: async () => ({
    auth: { getUser },
  }),
}));

vi.mock("@/lib/auth/ensure-profile", () => ({
  ensureProfileForAuthUser: (...args: unknown[]) =>
    ensureProfileForAuthUser(...args),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => redirect(path),
}));

import {
  getAuthUser,
  requireUserForApi,
  requireUserForPage,
} from "@/lib/auth/require-user";

beforeEach(() => {
  getUser.mockReset();
  ensureProfileForAuthUser.mockReset();
  redirect.mockClear();
});

describe("getAuthUser", () => {
  it("未ログインは null", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(getAuthUser()).resolves.toBeNull();
  });

  it("ログイン済みなら uid / email / username を返す", async () => {
    getUser.mockResolvedValue({
      data: {
        user: {
          id: "uid-1",
          email: "a@example.com",
          user_metadata: { username: "alice" },
        },
      },
    });
    ensureProfileForAuthUser.mockResolvedValue({
      ok: true,
      created: false,
      username: "alice",
    });

    await expect(getAuthUser()).resolves.toEqual({
      id: "uid-1",
      email: "a@example.com",
      username: "alice",
    });
  });

  it("Profile 補完失敗でも認可は続行（username null）", async () => {
    getUser.mockResolvedValue({
      data: { user: { id: "uid-1", email: null } },
    });
    ensureProfileForAuthUser.mockResolvedValue({
      ok: false,
      reason: "missing_username",
    });

    await expect(getAuthUser()).resolves.toEqual({
      id: "uid-1",
      email: null,
      username: null,
    });
  });
});

describe("requireUserForPage / requireUserForApi", () => {
  it("ページは未ログインで /login へ", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    await expect(requireUserForPage()).rejects.toThrow("REDIRECT:/login");
  });

  it("API は未ログインで 401、ログイン済みなら user", async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    const denied = await requireUserForApi();
    expect(denied.ok).toBe(false);
    if (!denied.ok) {
      expect(denied.response.status).toBe(401);
    }

    getUser.mockResolvedValue({
      data: { user: { id: "uid-1", email: "a@example.com" } },
    });
    ensureProfileForAuthUser.mockResolvedValue({
      ok: true,
      created: false,
      username: "alice",
    });
    const allowed = await requireUserForApi();
    expect(allowed).toEqual({
      ok: true,
      user: { id: "uid-1", email: "a@example.com", username: "alice" },
    });
  });
});
