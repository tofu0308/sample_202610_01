/**
 * Next.js 16 Proxy（旧 middleware）。
 * セッション更新と、未ログイン時の /login 誘導（管理者向け最小ガード）。
 */

import { NextResponse, type NextRequest } from "next/server";
import { getAdminEmail } from "@/lib/supabase/env";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的資産などは matcher で除外。auth コールバックは将来用に通す
  const isPublic =
    pathname.startsWith("/login") || pathname.startsWith("/auth");

  try {
    const { supabaseResponse, user } = await updateSession(request);

    const adminEmail = getAdminEmail();
    const emailOk =
      adminEmail == null ||
      (user?.email ?? "").toLowerCase() === adminEmail;

    if ((!user || !emailOk) && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }

    if (user && emailOk && pathname.startsWith("/login")) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
  } catch {
    // env 未設定時は開発中に全体を落とさないよう login へ寄せる
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
    return NextResponse.next({ request });
  }
}

export const config = {
  matcher: [
    /*
     * 静的ファイル・画像最適化を除外して Proxy を走らせる
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
