/**
 * Next.js 16 Proxy（旧 middleware）。
 * セッション更新と、未ログイン時の /login 誘導。
 * アプリ利用は「ログイン済み」なら可（ADMIN_EMAIL ゲートは使わない）。
 */

import { NextResponse, type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的資産などは matcher で除外。ログイン・登録・リセット・auth・logout は公開
  // /logout を公開にしないと未ログイン時に ?next=/logout が付き、再ログイン直後にまた /logout へ飛ぶ
  const isPublic =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/forgot-password") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/logout");

  try {
    const { supabaseResponse, user } = await updateSession(request);

    if (!user && !isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("next", pathname);
      // 303: 元が POST でも次は GET（307 だと POST が残りページで 405 になりうる）
      return NextResponse.redirect(url, 303);
    }

    // ログイン済みなら login / signup / リセット依頼には留めない
    if (
      user &&
      (pathname.startsWith("/login") ||
        pathname.startsWith("/signup") ||
        pathname.startsWith("/forgot-password"))
    ) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      url.search = "";
      return NextResponse.redirect(url, 303);
    }

    return supabaseResponse;
  } catch {
    // env 未設定時は開発中に全体を落とさないよう login へ寄せる
    if (!isPublic) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      return NextResponse.redirect(url, 303);
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
