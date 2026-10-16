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
 * 既定は node。hooks のテストファイル先頭で `@vitest-environment jsdom` を指定。
 */
export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/__tests__/**/*.test.ts", "src/**/*.test.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // lib + hooks。デバイス寄り・未着手の hook は exclude（テスト方針と同じ）
      include: ["src/lib/**/*.ts", "src/hooks/**/*.ts"],
      exclude: [
        "src/**/*.test.ts",
        "src/**/__tests__/**",
        "src/lib/prisma.ts",
        "src/lib/supabase/**",
        "src/lib/products/yahoo-shopping.ts",
        "src/lib/auth/ensure-profile.ts",
        "src/lib/auth/require-user.ts",
        "src/lib/items/status1-meter.ts",
        "src/lib/items/format-datetime-jst.ts",
        "src/lib/scan/camera-errors.ts",
        "src/lib/scan/types.ts",
        "src/hooks/scan/use-barcode-camera.ts",
        "src/hooks/scan/use-barcode-scan-flow.ts",
        "src/hooks/scan/use-continuous-scan.ts",
        "src/hooks/scan/use-body-scroll-lock.ts",
        "node_modules/**",
      ],
      // Windows でパス表記ゆれによる二重集計を避ける
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
