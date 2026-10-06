/**
 * Prisma 7 CLI 用設定（migrate / generate など）。
 * - CLI: DIRECT_URL（Session / Direct）
 * - アプリ実行時: src/lib/prisma.ts が DATABASE_URL（Transaction pooler）を使う
 */
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
