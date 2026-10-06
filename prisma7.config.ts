import "dotenv/config";
import { defineConfig, env } from "prisma/config";

// CLI（migrate 等）は DIRECT_URL（Session / Direct）
// アプリ実行時は src/lib/prisma.ts 側で DATABASE_URL（Transaction pooler）を使う
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DIRECT_URL"),
  },
});
