/**
 * サーバ用 Supabase クライアント（Server Component / Route Handler / Server Action）。
 * Cookie の書き込みは Proxy 側が担う（ここでは失敗しても無視してよい）。
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabaseEnv } from "@/lib/supabase/env";

export async function createClient() {
  const cookieStore = await cookies();
  const { url, anonKey } = getSupabaseEnv();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Server Component からの呼び出しでは Cookie を書けないことがある
        }
      },
    },
  });
}
