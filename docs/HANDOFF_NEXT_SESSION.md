# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 新スレッド開始時に下の「貼る用」をコピーして渡す。恒久ドキュメントではない。  
> 秘密情報（接続文字列・キーの値・パスワード）は書かない／チャットにも出さない。  
> 不要になったらこのファイルごと削除してよい。

最終更新: 2026-10-14

---

## 新スレッドに貼る用（要約）

```text
【引き継ぎ】消耗品インベントリ学習アプリ

リポ: C:\Users\isisa\worspace\sample_202610_01
GitHub: tofu0308/sample_202610_01（main）
本番: https://sample-202610-01.vercel.app/
設計: docs/DESIGN_BARCODE_SCAN.md
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261014.md（§10〜§14）
この引き継ぎ: docs/HANDOFF_NEXT_SESSION.md

スタック: Next.js 16 App Router + Prisma 7 + Supabase(PostgreSQL) + zod + Vitest
目的: バーコード → Yahoo 照会 → DB 登録 → 一覧で残量・メモ管理（消耗品メイン）

【完了済み】
- スキャン（単体／連続）+ Yahoo 商品照会（POST /api/products/lookup）
- Product / UserItem（Prisma migrate）。GET/POST/PATCH/DELETE /api/items
- 一覧 UI: 残量プリセット＋バー、メモ（バルーン）、更新日 JST、検索、一括選択・適用・削除
- スキャン UI: 読取リスト＋JAN コピー（商品情報パネルは廃止）
- 管理者ログイン: Supabase Auth、/login、src/proxy.ts、ADMIN_EMAIL 制限、公開サインアップなし
- ローカルで管理者ログイン成功済み。本番は未ログインだとログイン画面のみ（想定どおり）

【次にやること（優先）】
1. 一般ユーザー向け登録フロー（サインアップ UI・メール確認・ADMIN_EMAIL 制限の整理）
2. （必要なら）既存 UserItem の userId 付け替え確認（local-dev-user → Auth uid）
3. （任意）一括 API／ページネーション／status2・3／カテゴリ探索

【エージェントへの注意】
- commit / push は「commit して」「push して」など明示時だけ
- 秘密は .env のみ。MCP Supabase は read-only のまま
- 変更は依頼範囲に限定。Next は AGENTS.md と node_modules/next/dist/docs/ を優先
- 返答は日本語・簡潔。学習モードなので選定理由を短く
```

---

## 目的

Next.js（App Router）+ Prisma 7 + Supabase でフルスタックを学習する。  
バーコード起点の個人インベントリ（当面は消耗品）。  
**スキャン → 照会 → 登録 → 一覧編集 → 管理者ログイン** まで到達済み。

## リポジトリ / 環境

| 項目   | 内容                                                     |
| ------ | -------------------------------------------------------- |
| パス   | `C:\Users\isisa\worspace\sample_202610_01`               |
| GitHub | `tofu0308/sample_202610_01`（`main`、origin と同期想定） |
| 本番   | https://sample-202610-01.vercel.app/                     |
| DB     | Supabase PostgreSQL（ローカルと Vercel で同一 DB）       |
| 秘密   | `.env` のみ（値はチャットに出さない）                    |

### 必要な env（名前だけ）

- DB: `DATABASE_URL` / `DIRECT_URL`
- Yahoo: `YAHOO_APP_ID`
- Auth: `NEXT_PUBLIC_SUPABASE_URL`（`https://xxx.supabase.co` まで。`/rest/v1` は付けない）
- Auth: `NEXT_PUBLIC_SUPABASE_ANON_KEY`（Publishable / anon）
- Auth: `ADMIN_EMAIL`（管理者メール。未設定ならログイン済みなら誰でも可）

## 起動・チェック

```bash
cd C:/Users/isisa/worspace/sample_202610_01
npm run dev
```

```bash
npm run lint
npm run typecheck
npm run test
```

## 完了済み（現状）

| 領域     | 内容                                                                                        |
| -------- | ------------------------------------------------------------------------------------------- |
| 基盤     | Next.js 16 + Prisma 7 + Vercel + GitHub Actions CI                                          |
| スキャン | 単体／連続、Yahoo 照会、読取リスト（JAN コピー＋登録）                                      |
| DB / API | `Product` + `UserItem`。items CRUD + lookup（いずれもログイン必須）                         |
| 一覧     | 残量（`status1`）プリセット／バー、メモ、検索、一括操作、PC は枠内スクロール＋見出し sticky |
| 認証     | Supabase Auth。`/login`・ログアウト・`src/proxy.ts`・`ADMIN_EMAIL`。公開登録 UI **なし**    |

学習メモ詳細: `課題対応_20261014.md` §10（migrate）§11（登録）§12（一覧強化）§13（管理者ログイン）§14（現状確認）

## 構成（触るとき）

```
src/proxy.ts                 # セッション更新＋未ログイン→/login
src/app/login/               # 管理者ログイン
src/app/logout/              # POST でログアウト
src/lib/auth/require-user.ts # ページ／API の認可
src/lib/supabase/            # browser / server / proxy / env
src/components/auth/
src/components/scan/         # barcode-scanner + 読取リスト
src/components/items/        # 表・検索・一括バー・メモ・残量メーター
src/hooks/scan|items/
src/lib/scan|items|products/
src/app/api/products/lookup/
src/app/api/items/
```

| 画面ラベル | DB / コード                                          |
| ---------- | ---------------------------------------------------- |
| 残量       | `status1`（`STATUS1_OPTIONS`）                       |
| メモ       | `note`                                               |
| ユーザー   | Auth uid → `UserItem.userId`（旧: `local-dev-user`） |

## 認証の現状（重要）

- **公開サインアップなし**。ユーザーは Supabase Dashboard で作成（または今後アプリ登録を追加）
- ログイン成功後、API／一覧は **Auth uid** で絞る
- 本番未ログイン → ログイン画面のみ、は想定どおり
- URL に `/rest/v1` を付けると Auth が壊れる（過去に踏み済み。`env.ts` でオリジンに正規化）

### 既存データの付け替え（まだなら）

```sql
UPDATE "UserItem"
SET "userId" = '<auth-uid>'
WHERE "userId" = 'local-dev-user';
```

## 次にやること

1. **一般ユーザー向け登録フロー**（サインアップ UI、メール確認、`ADMIN_EMAIL` との役割分担）
2. 既存 `userId` 付け替えの確認（空一覧ならこれが原因のことが多い）
3. （任意）一括登録／一括 PATCH・DELETE API
4. （任意）ページネーション、`status2`/`status3`、カテゴリ探索

## 作業の進め方（エージェント向け）

- **commit / push は「commit して」「push して」など明示時だけ**（「修正して」はコードのみ）
- 秘密情報をチャット・commit に出さない。MCP Supabase は read-only
- 変更は依頼範囲に限定。無関係なリファクタしない
- Next.js 16 は通常と違う → `AGENTS.md` と `node_modules/next/dist/docs/`（Proxy は `src/proxy.ts`）
- 返答は日本語・簡潔。学習モードなので選定理由を短く（1〜3 点）

## 注意

- 旧 Note CRUD は削除済み（`UserItem.note` はメモ欄で別物）
- 生成クライアント `src/generated/prisma` は gitignore（`prisma generate`）
