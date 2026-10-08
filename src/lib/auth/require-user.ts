/**
 * ログイン中ユーザーの取得と管理者メールの制限。
 * UserItem.userId には Auth の uid を使う（仮定数 DEV_USER_ID の置き換え）。
 */

import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { getAdminEmail } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthUser = {
  id: string;
  email: string | null;
};

function isAllowedAdmin(email: string | null): boolean {
  const adminEmail = getAdminEmail();
  if (adminEmail == null) {
    return true;
  }
  return (email ?? "").toLowerCase() === adminEmail;
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }
  if (!isAllowedAdmin(user.email ?? null)) {
    return null;
  }

  return { id: user.id, email: user.email ?? null };
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
