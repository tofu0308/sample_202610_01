/**
 * ログアウトして /login へ戻す。
 * POST（ボタン）も GET（直打ち・誤った next）も同じ。signOut 失敗でも login へ。
 */

import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

async function signOutAndRedirectToLogin(request: Request) {
  try {
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch (error) {
    console.error("logout signOut failed", error);
  }

  const url = new URL("/login", request.url);
  return NextResponse.redirect(url, 303);
}

export async function GET(request: Request) {
  return signOutAndRedirectToLogin(request);
}

export async function POST(request: Request) {
  return signOutAndRedirectToLogin(request);
}
