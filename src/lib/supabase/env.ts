/**
 * Supabase 公開設定の読み取り。
 * URL / anon（または publishable）はブラウザにも載る前提のキーのみ。
 */

export function getSupabaseEnv(): { url: string; anonKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim() ||
    "";

  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL と NEXT_PUBLIC_SUPABASE_ANON_KEY（または PUBLISHABLE_KEY）が未設定です",
    );
  }

  return { url, anonKey };
}

/** 管理者として許可するメール（未設定ならログイン済みなら誰でも可・学習用） */
export function getAdminEmail(): string | null {
  const value = process.env.ADMIN_EMAIL?.trim().toLowerCase() ?? "";
  return value === "" ? null : value;
}
