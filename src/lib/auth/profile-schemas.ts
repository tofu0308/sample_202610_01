/**
 * Profile / 登録まわりの入力スキーマ（zod）。
 * 画面・API・テストで同じルールを使う（境界検証を一箇所に置く）。
 */

import { z } from "zod";

/** 画面の maxLength やエラー文言と揃えるための定数 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/**
 * 登録時必須のユーザーID。
 * trim → 小文字化してから長さ・文字種を見る（DB 一意と照合しやすくするため）。
 */
export const usernameSchema = z
  .string()
  .trim()
  .min(1, { message: "ユーザーIDは必須です" })
  .transform((value) => value.toLowerCase())
  .refine(
    (value) =>
      value.length >= USERNAME_MIN_LENGTH &&
      value.length <= USERNAME_MAX_LENGTH,
    {
      message: `ユーザーIDは${USERNAME_MIN_LENGTH}〜${USERNAME_MAX_LENGTH}文字です`,
    },
  )
  .refine((value) => /^[a-z0-9_]+$/.test(value), {
    message: "ユーザーIDは英数字とアンダースコアのみです",
  });

export type Username = z.infer<typeof usernameSchema>;

/** 登録フォーム（Email・パスワード・ユーザーID）。Auth 送信前のクライアント検証にも使う */
export const signupFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "Emailは必須です" })
    .email({ message: "Emailの形式が正しくありません" }),
  password: z
    .string()
    .min(6, { message: "パスワードは6文字以上です" }),
  username: usernameSchema,
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;
