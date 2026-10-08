/**
 * 登録 API（/api/items）の入力スキーマ（zod）。
 * Route Handler とユニットテストの両方から使い、境界検証のルールを一箇所に置く。
 */

import { z } from "zod";
import { STATUS1_OPTIONS } from "@/lib/items/constants";

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

/**
 * 任意テキスト。未送信は undefined、空文字 / null は DB 上 null（クリア）。
 */
const optionalClearableText = (max: number) =>
  z
    .union([z.string().trim().max(max), z.null()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (value === null || value === "") {
        return null;
      }
      return value;
    });

/**
 * status1 は候補のどれか、またはクリア（空 / null）。
 * 未送信は undefined（PATCH で触らない）。
 */
const optionalClearableStatus1 = z
  .union([z.enum(STATUS1_OPTIONS), z.literal(""), z.null()])
  .optional()
  .transform((value) => {
    if (value === undefined) {
      return undefined;
    }
    if (value === null || value === "") {
      return null;
    }
    return value;
  });

/**
 * PATCH /api/items/[id] 用。
 * note / status1 の少なくとも一方が必要。
 */
export const updateItemSchema = z
  .object({
    note: optionalClearableText(2000),
    status1: optionalClearableStatus1,
  })
  .refine(
    (data) => data.note !== undefined || data.status1 !== undefined,
    { message: "At least one of note or status1 is required" },
  );

/** Prisma update 用に、送られたフィールドだけ拾う */
export function toUserItemUpdateData(data: z.infer<typeof updateItemSchema>): {
  note?: string | null;
  status1?: string | null;
} {
  const update: { note?: string | null; status1?: string | null } = {};
  if (data.note !== undefined) {
    update.note = data.note;
  }
  if (data.status1 !== undefined) {
    update.status1 = data.status1;
  }
  return update;
}
