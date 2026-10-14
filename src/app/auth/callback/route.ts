/**
 * Auth コールバック（公開）。
 * 確認メール／将来のリセットリンクの code をセッション Cookie に交換する。
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const nextPath =
    nextParam && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // ローカルはそのまま origin。本番でリバプロ経由なら forwarded host を優先
      const isLocal = process.env.NODE_ENV === "development";
      const forwardedHost = request.headers.get("x-forwarded-host");
      const redirectBase =
        !isLocal && forwardedHost ? `https://${forwardedHost}` : origin;
      return NextResponse.redirect(`${redirectBase}${nextPath}`);
    }
  }

  const loginUrl = new URL("/login", origin);
  loginUrl.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(loginUrl);
}
