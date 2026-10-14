/**
 * ログイン中ユーザーの取得（アプリ利用はログイン済みなら可）。
 * UserItem.userId には Auth の uid を使う。
 * Profile が無ければ metadata の username から補完作成を試みる。
 * username は表示用（ヘッダー「○○さん」）。Dashboard 作成の既存管理者は無いことがある。
 * ADMIN_EMAIL はゲートに使わない（将来の管理用途向けに env 側へ残置）。
 */

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { ensureProfileForAuthUser } from "@/lib/auth/ensure-profile";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | null;
  /** Profile の username。未作成（既存管理者など）は null */
  username: string | null;
};

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  // ページ／API 到達時にも補完（確認リンクを既に踏んだユーザー向け）。失敗しても認可は続行
  const profileResult = await ensureProfileForAuthUser(user);

  return {
    id: user.id,
    email: user.email ?? null,
    username: profileResult.ok ? profileResult.username : null,
  };
}

/** ページ用。未ログインなら /login へ */
export async function requireUserForPage(): Promise<AuthUser> {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }
  return user;
}

/** API 用。未ログインなら 401 Response を返す */
export async function requireUserForApi(): Promise<
  { ok: true; user: AuthUser } | { ok: false; response: NextResponse }
> {
  const user = await getAuthUser();
  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { ok: true, user };
}
