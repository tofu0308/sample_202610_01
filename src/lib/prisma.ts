/**
 * Prisma Client のシングルトン。
 * アプリ実行時は DATABASE_URL（Transaction pooler）を使い、
 * CLI（migrate 等）は prisma7.config.ts の DIRECT_URL を使う。
 */

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  // Prisma 7 は driver adapter 経由で接続する
  const adapter = new PrismaPg({ connectionString });
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

// 開発時の HMR で Client が増殖しないよう global に保持する
if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
