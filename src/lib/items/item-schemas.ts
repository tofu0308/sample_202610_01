/**
 * 登録 API（/api/items）の入力スキーマ（zod）。
 * Route Handler とユニットテストの両方から使い、境界検証のルールを一箇所に置く。
 */

import { z } from "zod";

/** lookup と同じ JAN 正規化（数字のみ・8〜14 桁） */
const janCodeSchema = z
  .string()
  .trim()
  .min(1)
  .max(32)
  .transform((value) => value.replace(/\D/g, ""))
  .refine((digits) => digits.length >= 8 && digits.length <= 14, {
    message: "Barcode must be 8–14 digits",
  });

/**
 * POST /api/items 用。
 * クライアントは照会成功スナップショットを送る（登録時に Yahoo 再照会しない）。
 */
export const createItemSchema = z.object({
  code: janCodeSchema,
  name: z.string().trim().min(1).max(500),
  brandName: z.string().trim().min(1).max(200).optional(),
  // URL 形式は見るが、ホスト制限はしない（Yahoo 画像ホストが可変なため）
  imageUrl: z.string().trim().url().max(2000).optional(),
  source: z.literal("yahoo_shopping"),
});
