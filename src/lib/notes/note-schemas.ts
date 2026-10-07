/**
 * Note API の入力スキーマ（zod）。
 * Route Handler とユニットテストの両方から使い、境界検証のルールを一箇所に置く。
 */

import { z } from "zod";

/** POST /api/notes 用 */
export const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
});

/** PATCH /api/notes/[id] 用 */
export const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
});

/**
 * PATCH 時の body 反映ルール。
 * - 未送信: フィールドを更新しない
 * - 空文字: DB 上は null（本文クリア）
 * - それ以外: その文字列を保存
 */
export function resolveNoteBodyUpdate(
  body: string | undefined,
): { body: string | null } | Record<string, never> {
  if (body === undefined) {
    return {};
  }
  return { body: body === "" ? null : body };
}
