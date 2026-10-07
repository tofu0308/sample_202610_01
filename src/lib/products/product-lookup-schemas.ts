/**
 * 商品照会 API の入力スキーマ（zod）。
 * JAN / バーコード文字列を境界で検証し、外部 API に渡す前に形を揃える。
 */

import { z } from "zod";

/** POST /api/products/lookup 用。数字のみ（ハイフン等は除去後に判定） */
export const productLookupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(1)
    .max(32)
    .transform((value) => value.replace(/\D/g, ""))
    .refine((digits) => digits.length >= 8 && digits.length <= 14, {
      message: "Barcode must be 8–14 digits",
    }),
});
