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
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261014.md（登録方針は §14）
設計の登録・組織: docs/DESIGN_BARCODE_SCAN.md §13 / §14
作業単位: docs/AUTH_SIGNUP_WORK_UNITS.md（U1〜U11 完了。次 U12）
この引き継ぎ: docs/HANDOFF_NEXT_SESSION.md

スタック: Next.js 16 App Router + Prisma 7 + Supabase(PostgreSQL) + zod + Vitest
目的: バーコード → Yahoo 照会 → DB 登録 → 一覧で残量・メモ管理（消耗品メイン）

【完了済み】
- スキャン（単体／連続）+ Yahoo 商品照会（POST /api/products/lookup）
- Product / UserItem（Prisma migrate）。GET/POST/PATCH/DELETE /api/items
- 一覧 UI: 残量プリセット＋バー、メモ（バルーン）、更新日 JST、検索、一括選択・適用・削除
- スキャン UI: 読取リスト＋JAN コピー（商品情報パネルは廃止）
- Auth: /signup・確認メール・callback・Profile・ゲート解除・「○○さん」・forgot/update-password

【次にやること（優先）】
1. 学習メモに Auth の仕組みを短く追記（U12・確認のうえ）
2. 安定後に local-dev-user のコード・データ削除（U13）
3. （任意）一括 API／ページネーション／status2・3／カテゴリ探索
※ 組織単位は将来。設計書 §14（orgId 追加想定）。第1弾では触らない

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
| 認証     | Supabase Auth。`/signup`・`/login`・リセット・`Profile`・ログイン済みなら利用可 |

学習メモ: `課題対応_20261014.md`（登録方針は §14）。設計の正本は `DESIGN_BARCODE_SCAN.md` §13/§14。

## 構成（触るとき）

```
src/proxy.ts                 # セッション更新＋未ログイン→/login
src/app/login/ signup/ forgot-password/ update-password/
src/app/auth/callback/       # code → セッション＋ Profile
src/app/logout/              # POST でログアウト
src/lib/auth/                # require-user / ensure-profile / profile-schemas
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
| 表示名     | `Profile.username`（「○○さん」）                     |

## 認証の現状（重要）

- **いま**: 公開 `/signup`（確認メール）。ゲートなし（ログイン済みなら可）。ヘッダーは username
- パスワードリセット: `/forgot-password` → メール → `/auth/callback` → `/update-password`
- ログイン成功後、API／一覧は **Auth uid** で絞る（これは維持）
- 組み込みメールはおおむね **1 時間 2 通**（Rate Limits）
- URL に `/rest/v1` を付けると Auth が壊れる（`env.ts` でオリジンに正規化）

### 旧 `local-dev-user`

一般利用が安定したら **コード・データとも削除してよい**（付け替え運用は必須ではない）。残っていると管理者一覧に旧分が出ない原因になりうる。

## 次にやること

1. 学習メモに Auth の仕組みを短く追記（U12・確認のうえ）
2. 安定後に `local-dev-user` 削除（U13）
3. （任意）一括 API／ページネーション／`status2`/`3`／カテゴリ探索
4. （将来）組織単位 … 設計書 §14。第1弾では触らない

## 作業の進め方（エージェント向け）

- **commit / push は「commit して」「push して」など明示時だけ**（「修正して」はコードのみ）
- 秘密情報をチャット・commit に出さない。MCP Supabase は read-only
- 変更は依頼範囲に限定。無関係なリファクタしない
- Next.js 16 は通常と違う → `AGENTS.md` と `node_modules/next/dist/docs/`（Proxy は `src/proxy.ts`）
- 返答は日本語・簡潔。学習モードなので選定理由を短く（1〜3 点）

## 注意

- 旧 Note CRUD は削除済み（`UserItem.note` はメモ欄で別物）
- 生成クライアント `src/generated/prisma` は gitignore（`prisma generate`）
