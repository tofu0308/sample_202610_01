/**
 * ログアウトして /login へ戻す（POST 想定）。
 * signOut 失敗でもログイン画面へ戻す（セッション残存は次の認証で再判定）。
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("logout signOut failed", error);
  }

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, { status: 303 });
}
