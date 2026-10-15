/**
 * Profile / 登録まわりの入力スキーマ（zod）。
 * 画面・API・テストで同じルールを使う（境界検証を一箇所に置く）。
 */

import { z } from "zod";

/** 画面の maxLength やエラー文言と揃えるための定数 */
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;
export const PASSWORD_MIN_LENGTH = 6;

const PASSWORD_MIN_MESSAGE = `パスワードは${PASSWORD_MIN_LENGTH}文字以上です`;

/** 登録・再設定で共通のパスワード欄（長さルールを一箇所に） */
const passwordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, { message: PASSWORD_MIN_MESSAGE });

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

/** 登録フォーム（メール・パスワード・ユーザーID）。Auth 送信前のクライアント検証にも使う */
export const signupFormSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, { message: "メールは必須です" })
    .email({ message: "メールの形式が正しくありません" }),
  password: passwordSchema,
  username: usernameSchema,
});

export type SignupFormValues = z.infer<typeof signupFormSchema>;

/** 新パスワード設定（リセット後／任意の変更）。確認入力と一致させる */
export const updatePasswordFormSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z
      .string()
      .min(1, { message: "確認用パスワードを入力してください" }),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "パスワードが一致しません",
    path: ["confirmPassword"],
  });

export type UpdatePasswordFormValues = z.infer<typeof updatePasswordFormSchema>;

