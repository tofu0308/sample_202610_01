import { afterEach, describe, expect, it } from "vitest";
import { getAdminEmail, getSupabaseEnv } from "@/lib/supabase/env";

const ORIGINAL = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anon: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  publishable: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  admin: process.env.ADMIN_EMAIL,
};

afterEach(() => {
  process.env.NEXT_PUBLIC_SUPABASE_URL = ORIGINAL.url;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = ORIGINAL.anon;
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = ORIGINAL.publishable;
  process.env.ADMIN_EMAIL = ORIGINAL.admin;
});

describe("getSupabaseEnv", () => {
  it("/rest/v1 を落として origin だけ返す", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co/rest/v1";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "anon-key";
    delete process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

    expect(getSupabaseEnv()).toEqual({
      url: "https://abc.supabase.co",
      anonKey: "anon-key",
    });
  });

  it("PUBLISHABLE_KEY を anon の代わりに使える", () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://abc.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY = "pub-key";

    expect(getSupabaseEnv().anonKey).toBe("pub-key");
  });

  it("未設定や不正 URL は throw", () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "x";
    expect(() => getSupabaseEnv()).toThrow(/未設定/);

    process.env.NEXT_PUBLIC_SUPABASE_URL = "not-a-url";
    expect(() => getSupabaseEnv()).toThrow(/正しい URL/);
  });
});

describe("getAdminEmail", () => {
  it("空なら null、値があれば小文字で返す", () => {
    delete process.env.ADMIN_EMAIL;
    expect(getAdminEmail()).toBeNull();

    process.env.ADMIN_EMAIL = "  Admin@Example.COM ";
    expect(getAdminEmail()).toBe("admin@example.com");
  });
});
