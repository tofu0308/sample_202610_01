/**
 * 登録 API 用の件数上限チェック（サーバ境界）。
 * クライアントの disabled は補助。ここが正。
 */

import {
  countNewItemIncrement,
  formatUserItemBulkLimitMessage,
  formatUserItemLimitReachedMessage,
  getUserItemLimit,
  isUserItemLimitExempt,
  wouldExceedUserItemLimit,
} from "@/lib/items/user-item-limit";
import { prisma } from "@/lib/prisma";

export type AssertUserItemLimitResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * 追加しようとしている JAN 群が残り枠に収まるか。
 * 管理者は常に ok。新規増分 0（すべて所持済み）も ok（後段の 409／duplicates に任せる）。
 */
export async function assertUserItemLimit(options: {
  userId: string;
  email: string | null;
  requestCodes: readonly string[];
}): Promise<AssertUserItemLimitResult> {
  if (isUserItemLimitExempt(options.email)) {
    return { ok: true };
  }

  const limit = getUserItemLimit();
  const uniqueCodes = [...new Set(options.requestCodes)];
  const currentCount = await prisma.userItem.count({
    where: { userId: options.userId },
  });

  const ownedRows =
    uniqueCodes.length === 0
      ? []
      : await prisma.userItem.findMany({
          where: {
            userId: options.userId,
            product: { jan: { in: uniqueCodes } },
          },
          select: { product: { select: { jan: true } } },
        });

  const ownedJans = new Set(ownedRows.map((row) => row.product.jan));
  const newIncrement = countNewItemIncrement(options.requestCodes, ownedJans);

  if (!wouldExceedUserItemLimit(currentCount, newIncrement, limit)) {
    return { ok: true };
  }

  // 単件かつすでに上限到達で新規 1 件、は短い文言
  if (uniqueCodes.length === 1 && newIncrement === 1 && currentCount >= limit) {
    return { ok: false, message: formatUserItemLimitReachedMessage(limit) };
  }

  return {
    ok: false,
    message: formatUserItemBulkLimitMessage({
      limit,
      currentCount,
      newIncrement,
    }),
  };
}
