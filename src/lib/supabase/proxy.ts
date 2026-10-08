/**
 * Next.js Proxy 用のセッション更新。
 * 期限切れトークンをリフレッシュし、Cookie を request / response に載せる。
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const { url, anonKey } = getSupabaseEnv();

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        supabaseResponse = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          supabaseResponse.cookies.set(name, value, options);
        }
      },
    },
  });

  // getUser でサーバ確認しつつ Cookie 更新を誘発する（間に他処理を挟まない）
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return { supabaseResponse, user };
}
