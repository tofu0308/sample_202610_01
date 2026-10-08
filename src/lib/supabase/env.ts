/**
 * Supabase 公開設定の読み取り。
 * URL / anon（または publishable）はブラウザにも載る前提のキーのみ。
 */

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  if (!rawUrl || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY（または PUBLISHABLE_KEY）が未設定です",
    );
  }

  // Data API の /rest/v1 まで貼ると Auth のパスが壊れるのでオリジンだけ使う
  let url = rawUrl;
  try {
    url = new URL(rawUrl).origin;
  } catch {
    throw new Error("NEXT_PUBLIC_SUPABASE_URL が正しい URL ではありません");
  }

  return { url, anonKey };
}

/** 管理者として許可するメール（未設定ならログイン済みなら誰でも可・学習用） */
export function getAdminEmail(): string | null {
  const value = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  return value === "" ? null : value;
}
