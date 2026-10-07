# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 次セッションへの引き継ぎ用。内容を別メモへ移したあと、または不要になったら **このファイルごと削除する**。  
> 恒久ドキュメントではない。秘密情報（接続文字列・キーの値）は書かない。  
> 次スレッドに貼ったあとも、リポジトリに残す必要がなければ削除してよい。

## 目的

Next.js（App Router）+ Prisma 7 + Supabase でフルスタックを学習する。  
塗料所持管理（バーコード登録）へ向けて、スキャン → Yahoo 照会 → DB 登録の流れを作る。

## リポジトリ / 環境

- パス: `C:\Users\isisa\worspace\sample_202610_01`（OneDrive 外）
- GitHub: `tofu0308/sample_202610_01`（`main`）
- 本番 URL: https://sample-202610-01.vercel.app/
- Supabase プロジェクト名: `sample_202610_01`（Tokyo）  
  ※ローカルと Vercel で **同一 DB 共用**
- 秘密情報は `.env` のみ（`DATABASE_URL` / `DIRECT_URL` / `YAHOO_APP_ID`）。チャット・Git に載せない
- MCP Supabase は read_only のまま

## 起動

```bash
cd C:/Users/isisa/worspace/sample_202610_01
npm run dev
```

品質チェック:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
```

## 完了済み（2026-10-07 時点）

- Cursor: User Rules / Project Rules / MCP（Supabase read-only・GitHub）
- Next.js 16 + Prisma 7 + Note CRUD + Vercel + GitHub Actions CI
- **Phase 1**: カメラ読取（`html5-qrcode`・全画面オーバーレイ・PC は `md:hidden`）
- **Phase 2**: Yahoo 商品検索 v3（`POST /api/products/lookup`、アフィなし）
- **連続スキャン**: 単体/連続トグル、JAN 排他、照会キュー、オーバーレイは直近のみ、リストに画像
- コードは `scan` / `notes` / `products` 配下に浅い分割（テストは `__tests__/`）
- 設計: `docs/DESIGN_BARCODE_SCAN.md`（Phase 3 塗料所持の DB 案あり）
- 学習メモ: `C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261007.md`（§7〜§9）

## 構成の要点（触るとき）

- スキャン: `components/scan/*`・`hooks/scan/*`、Yahoo: `lib/products/*`（サーバのみ）
- API は zod で境界検証 → `@/lib/prisma`
- 生成クライアント `src/generated/prisma` は gitignore
- Vitest: `vitest.config.mts`（coverage は `lib/notes/note-schemas.ts`）

## 次にやること（優先）

1. **Phase 3a**: `Product` / `UserPaint` migrate → スキャン／連続リストから登録・一覧・削除
2. （任意）連続スキャンの実機再確認（重複 JAN・カメラ領域）
3. （任意）Vercel の `YAHOO_APP_ID` 確認
4. Phase 3 設計の未決: 塗料開始 `category_id`、`remaining` の型
5. Phase 4: 認証（3a のあと）

## 作業の進め方（エージェント向け）

- 基本 TypeScript。既存の書き方・構成に揃える。依頼範囲外のリファクタしない
- **commit / push はユーザーが「commit して」「push して」など明示したときだけ**
- 秘密情報をチャットに出さない。`.env` を commit しない
- 返答は日本語・簡潔。選定理由は短く（学習モード）
- Next.js は通常と違う点あり → 必要なら `node_modules/next/dist/docs/` と `AGENTS.md` を確認
- 破壊的操作は推測せず確認。MCP Supabase でスキーマ変更しない（Prisma migrate）

## 注意

- NestJS は未使用（API は Next Route Handlers）
- Note 手動作成 UI はコメントアウト済み。モデル削除は依頼があるまでしない
- Free 枠超過は自動課金より制限寄り。組織は Free のまま運用中
