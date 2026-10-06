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
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      include: ["src/lib/note-schemas.ts"],
      exclude: ["src/**/*.test.ts", "node_modules/**"],
      // Windows でパス表記ゆれによる二重集計を避ける
      all: false,
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
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
