/**
 * Auth ユーザーに対応する Profile が無ければ作る。
 * username は signUp 時に載せた user_metadata から取る（確認後・初回セッション向け）。
 */

import { Prisma } from "@/generated/prisma/client";
import { usernameSchema } from "@/lib/auth/profile-schemas";
import { prisma } from "@/lib/prisma";

export type EnsureProfileResult =
  | { ok: true; created: boolean; username: string }
  | { ok: false; reason: "missing_username" | "username_taken" | "unknown" };

type AuthUserLike = {
  id: string;
  user_metadata?: Record<string, unknown>;
};

export async function ensureProfileForAuthUser(
  user: AuthUserLike,
): Promise<EnsureProfileResult> {
  const existing = await prisma.profile.findUnique({
    where: { authUserId: user.id },
  });
  if (existing) {
    return { ok: true, created: false, username: existing.username };
  }

  const parsed = usernameSchema.safeParse(user.user_metadata?.username);
  if (!parsed.success) {
    return { ok: false, reason: "missing_username" };
  }

  try {
    await prisma.profile.create({
      data: {
        authUserId: user.id,
        username: parsed.data,
      },
    });
    return { ok: true, created: true, username: parsed.data };
  } catch (error) {
    // P2002 は HTTP レスポンスではなく、Prisma が unique 違反時に投げる例外コード。
    // クライアント向けには reason: username_taken に言い換える。
    // https://www.prisma.io/docs/orm/reference/error-reference#p2002
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return { ok: false, reason: "username_taken" };
    }
    console.error("ensureProfileForAuthUser failed", error);
    return { ok: false, reason: "unknown" };
  }
}
