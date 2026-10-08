# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 次セッションへの引き継ぎ用。内容を別メモへ移したあと、または不要になったら **このファイルごと削除する**。  
> 恒久ドキュメントではない。秘密情報（接続文字列・キーの値）は書かない。  
> 次スレッドに貼ったあとも、リポジトリに残す必要がなければ削除してよい。

最終更新: 2026-10-08（新スレッド向けに更新）

---

## 新スレッドに貼る用（要約）

```text
リポ: C:\Users\isisa\worspace\sample_202610_01
本番: https://sample-202610-01.vercel.app/
設計: docs/DESIGN_BARCODE_SCAN.md
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261008.md

完了: Phase1 カメラ読取 / Phase2 Yahoo JAN照会 / 連続スキャン / 浅いディレクトリ分割
次: Phase 3a（Product + UserItem の migrate → スキャン／連続リストから登録・一覧・削除）
設計: 汎用所持（presetKey）。status1〜3 は null 可。プリセット UI（book の未読/読了等）は 3d
注意: commit/push は明示依頼時のみ。秘密は .env のみ。MCP Supabase は read-only。
```

---

## 目的

Next.js（App Router）+ Prisma 7 + Supabase でフルスタックを学習する。  
バーコード起点の個人インベントリ（**当面は消耗品メイン**。将来は永続系モードも検討）へ向けて **スキャン → Yahoo 照会 → DB 登録** の流れを作る。

## リポジトリ / 環境

- パス: `C:\Users\isisa\worspace\sample_202610_01`（OneDrive 外）
- GitHub: `tofu0308/sample_202610_01`（`main`、working tree clean 想定）
- 本番 URL: https://sample-202610-01.vercel.app/
- Supabase プロジェクト名: `sample_202610_01`（Tokyo）  
  ※ローカルと Vercel で **同一 DB 共用**
- 秘密情報は `.env` のみ（`DATABASE_URL` / `DIRECT_URL` / `YAHOO_APP_ID`）
- MCP Supabase は read_only のまま（スキーマ変更は Prisma migrate）

## 起動

```bash
cd C:/Users/isisa/worspace/sample_202610_01
npm run dev
```

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
```

## 完了済み（〜2026-10-07）

| 領域 | 内容 |
|---|---|
| 基盤 | Next.js 16 + Prisma 7 + Vercel + GitHub Actions CI（旧 Note CRUD は削除済み） |
| Phase 1 | `html5-qrcode` カメラ読取・全画面オーバーレイ・PC は `md:hidden` |
| Phase 2 | Yahoo 商品検索 v3（`POST /api/products/lookup`、アフィなし） |
| 連続スキャン | 単体/連続トグル、JAN 排他、照会キュー、オーバーレイは直近のみ、リストに画像 |
| 構成 | `scan` / `items` / `products` の浅い分割。テストは `__tests__/` |
| ドキュメント | `docs/` に一時設計・引き継ぎ（削除前提）。学習メモ §7〜§9 |

最近の commit 例: 連続読取修正 → リファクタ → `docs/` 保管。

## 構成（触るとき）

```
src/components/scan/     # barcode-scanner（結線）+ 子 UI
src/components/items/    # 登録一覧・登録ボタン
src/hooks/scan|items/
src/lib/scan|items|products/
src/app/api/products/lookup/
src/app/api/items/
docs/DESIGN_BARCODE_SCAN.md   # Phase 3 DB 案は §11
docs/HANDOFF_NEXT_SESSION.md  # 本ファイル
```

- 連続ロジックの核: `hooks/scan/use-continuous-scan.ts`
- Yahoo ラッパ: `lib/products/yahoo-shopping.ts`（サーバのみ）
- API は zod 境界検証 → `@/lib/prisma`
- 生成クライアント `src/generated/prisma` は gitignore（`prisma generate`）

## 次にやること（優先）

1. （任意）`remaining` / `status2`・`3` / 登録済み検索
2. （任意）まとめて登録の一括 API（いまは単件 POST 順呼び）
3. （任意）連続スキャンの実機再確認／Vercel の `YAHOO_APP_ID` 確認
4. カテゴリ探索登録（塗料開始 `category_id` 未決）／ステータスプリセット
5. 認証（仮 `userId` を本番 uid に。編集・登録より先にはしない）

完了済み: 登録・一覧・削除・表ソート・`note`/`status1` 編集

## 作業の進め方（エージェント向け）

- 基本 TypeScript。既存の書き方・構成に揃える。依頼範囲外のリファクタしない
- **commit / push は「commit して」「push して」など明示時だけ**（「修正して」はコードのみ）
- 秘密情報をチャットに出さない。`.env` を commit しない
- 返答は日本語・簡潔。選定理由は短く（学習モード）
- Next.js は通常と違う点あり → 必要なら `node_modules/next/dist/docs/` と `AGENTS.md`
- 破壊的操作は推測せず確認

## 注意

- NestJS は未使用（API は Next Route Handlers）
- Note モデル / API / UI は削除済み（`UserItem.note` コメント欄は別物で残置）
- アフィリエイトは当面なし
- Free 枠超過は自動課金より制限寄り
