/**
 * 登録上限の画面表示用（Client に渡す値）。
 * サーバの assertUserItemLimit と同じ数え方を UI でも使う。
 */

import {
  countNewItemIncrement,
  formatUserItemBulkLimitMessage,
  formatUserItemLimitReachedMessage,
  getUserItemRemaining,
  wouldExceedUserItemLimit,
} from "@/lib/items/user-item-limit";

export type ItemLimitView = {
  currentCount: number;
  limit: number;
  /** ADMIN_EMAIL 一致などで制限しない */
  unlimited: boolean;
  /** 所持中の JAN（新規増分の計算用） */
  ownedJans: readonly string[];
};

export function isRegisterBlockedByLimit(view: ItemLimitView): boolean {
  if (view.unlimited) {
    return false;
  }
  return view.currentCount >= view.limit;
}

export function isBulkRegisterBlockedByLimit(
  view: ItemLimitView,
  requestCodes: readonly string[],
): boolean {
  if (view.unlimited) {
    return false;
  }
  const owned = new Set(view.ownedJans);
  const newIncrement = countNewItemIncrement(requestCodes, owned);
  return wouldExceedUserItemLimit(view.currentCount, newIncrement, view.limit);
}

export function registerLimitHint(view: ItemLimitView): string | null {
  if (view.unlimited || !isRegisterBlockedByLimit(view)) {
    return null;
  }
  return formatUserItemLimitReachedMessage(view.limit);
}

export function bulkRegisterLimitHint(
  view: ItemLimitView,
  requestCodes: readonly string[],
): string | null {
  if (view.unlimited || !isBulkRegisterBlockedByLimit(view, requestCodes)) {
    return null;
  }
  const owned = new Set(view.ownedJans);
  const newIncrement = countNewItemIncrement(requestCodes, owned);
  return formatUserItemBulkLimitMessage({
    limit: view.limit,
    currentCount: view.currentCount,
    newIncrement,
  });
}

export function formatItemCountLabel(view: ItemLimitView): string {
  if (view.unlimited) {
    return `${view.currentCount} 件（制限なし）`;
  }
  return `${view.currentCount} / ${view.limit}`;
}

export function remainingSlots(view: ItemLimitView): number | null {
  return getUserItemRemaining(view.currentCount, view.limit, view.unlimited);
}
