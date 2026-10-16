/**
 * 1ユーザーあたりの UserItem 登録上限。
 * 既定 100。env USER_ITEM_LIMIT で上書き。ADMIN_EMAIL は無制限。
 */

import { getAdminEmail } from "@/lib/supabase/env";

/** 一般ユーザーの所持登録上限（未設定時） */
export const DEFAULT_USER_ITEM_LIMIT = 100;

/** env または既定の上限件数（1 未満は既定にフォールバック） */
export function getUserItemLimit(): number {
  const raw = process.env.USER_ITEM_LIMIT?.trim();
  if (raw === undefined || raw === "") {
    return DEFAULT_USER_ITEM_LIMIT;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return DEFAULT_USER_ITEM_LIMIT;
  }
  return parsed;
}

/** 管理者メールと一致すれば件数制限しない */
export function isUserItemLimitExempt(email: string | null | undefined): boolean {
  const admin = getAdminEmail();
  if (!admin || !email) {
    return false;
  }
  return email.trim().toLowerCase() === admin;
}

/**
 * リクエスト内 JAN のうち、まだ所持に無いユニーク件数（枠を食う増分）。
 * 所持済みや重複コードは増分に数えない。
 */
export function countNewItemIncrement(
  requestCodes: readonly string[],
  ownedJans: ReadonlySet<string>,
): number {
  const seen = new Set<string>();
  let increment = 0;
  for (const code of requestCodes) {
    if (seen.has(code)) {
      continue;
    }
    seen.add(code);
    if (!ownedJans.has(code)) {
      increment += 1;
    }
  }
  return increment;
}

export function wouldExceedUserItemLimit(
  currentCount: number,
  newIncrement: number,
  limit: number,
): boolean {
  return currentCount + newIncrement > limit;
}

export function formatUserItemLimitReachedMessage(limit: number): string {
  return `登録上限（${limit}件）に達しています。不要な登録を削除してから追加してください。`;
}

export function formatUserItemBulkLimitMessage(options: {
  limit: number;
  currentCount: number;
  newIncrement: number;
}): string {
  const remaining = Math.max(0, options.limit - options.currentCount);
  return `登録可能件数は ${options.limit} 件までです。（いま ${options.currentCount} 件／あと ${remaining} 件まで。新規 ${options.newIncrement} 件のため登録できません）`;
}

/** UI 用: 残り枠（無制限は null） */
export function getUserItemRemaining(
  currentCount: number,
  limit: number,
  unlimited: boolean,
): number | null {
  if (unlimited) {
    return null;
  }
  return Math.max(0, limit - currentCount);
}
