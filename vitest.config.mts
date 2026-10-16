import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

const rootDir = path.dirname(fileURLToPath(import.meta.url));

/**
 * Vitest 設定。
 * アプリ本体は Next.js のまま。Vite をフロント構築に使わなくても、
 * Vitest はテスト実行用に Vite 基盤を内部利用できる。
 *
 * Vitest 5 は現状この環境で不安定だったため 3.x を使用。
 * 既定は node。hooks は `@vitest-environment happy-dom`（jsdom より起動が軽い）。
 * hooks テストはドメイン単位でまとめ、DOM 環境の起動回数を抑える。
 */
export default defineConfig({
  test: {
    environment: "node",
    // Windows で DOM 環境を同時に大量起動しない
    maxWorkers: 4,
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // lib + hooks を測る。除外はテスト／依存配線／型のみに限定
      include: ["src/lib/**/*.ts", "src/hooks/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__tests__/**",
        "node_modules/**",
        // import 時に実接続・SDK 初期化が走る配線（テスト側 mock の対象側）
        "src/lib/prisma.ts",
        "src/lib/supabase/client.ts",
        "src/lib/supabase/server.ts",
        "src/lib/supabase/proxy.ts",
        // ランタイム無し（型定義のみ）
        "src/lib/scan/types.ts",
      ],
      // Windows でパス表記ゆれ（/ と \）による二重集計を避ける。
      // 未実行ファイルを強制集計したい場合は all: true を検討（要検証）。
      all: false,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 75,
        statements: 80,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(rootDir, "./src"),
    },
  },
});
