# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 新スレッド開始時に下の「貼る用」をコピーして渡す。恒久ドキュメントではない。  
> 秘密情報（接続文字列・キーの値・パスワード）は書かない／チャットにも出さない。  
> 不要になったらこのファイルごと削除してよい。

最終更新: 2026-10-16

---

## 新スレッドに貼る用（要約）

```text
【引き継ぎ】消耗品インベントリ学習アプリ

リポ: C:\Users\isisa\worspace\sample_202610_01
GitHub: tofu0308/sample_202610_01（main・origin と同期済み想定）
本番: https://sample-202610-01.vercel.app/
設計: docs/DESIGN_BARCODE_SCAN.md（UI タスクは §17）
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応\課題対応_20261016.md
  （同フォルダに日ごと過去分あり。§14〜§26 が Auth〜UT〜lint）
作業単位 Auth: docs/AUTH_SIGNUP_WORK_UNITS.md（U1〜U13 完了・削除可）
この引き継ぎ: docs/HANDOFF_NEXT_SESSION.md

スタック: Next.js 16 App Router + Prisma 7 + Supabase(PostgreSQL) + zod + Vitest
目的: バーコード → Yahoo 照会 → DB 登録 → 一覧で残量・メモ管理（消耗品メイン）

【到達済み】
- スキャン（単体／連続）+ Yahoo 照会 + 登録一覧（残量・メモ・検索・一括）
- Auth: /signup・確認メール・callback・Profile・一般利用可・「○○さん」
  /forgot-password → /update-password、local-dev-user 削除済み
- エラー: error.tsx + throwAppError（想定内はインライン）
- Product: 照会成功時にマスタ表示用を更新（見つからなくても所持は消さない）
- UI 改修（体裁・スキャン操作・待ちバナー・一括バー／主ボタン／行タッチ）
- リファクタ: コンポーネント分割、useItemsTable 分割、scan↔items 依存緩和、
  list-refresh 抽出、定数・DTO・文言の lib 寄せ
- 一括 API: PATCH/DELETE/POST /api/items/bulk（件数上限・自分の行のみ）
- UT: lib 境界を拡充。coverage は src/lib/**/*.ts + exclude。本番へ DI しない
- CI: react-hooks lint（ref / setState-in-effect）修正済み（main）

【次にやること（優先は任意）】
1. UI 改修の残り（設計書 §17）: B4/B5、D7–D11、E5、F2–F4 など
2. （区切り検討）登録の体感短縮（楽観的更新）。失敗時ロールバック方針を決めてから
3. （任意）ページネーション、`status2`/`3`（一括 API は済み）
4. （将来）組織単位。第1弾では触らない
※ 確認メール再送 UI、フォームを noValidate+zod に寄せるかは後で検討

【エージェントへの注意】
- commit / push は「commit して」「push して」など明示時だけ
- 秘密は .env のみ。MCP Supabase は read-only のまま
- 変更は依頼範囲に限定。Next は AGENTS.md と node_modules/next/dist/docs/ を優先
- 学習メモは 課題対応_20261016.md に追記（確認してから。勝手に長く書かない）
- 返答は日本語・簡潔。学習モードなので選定理由を短く
```

---

## 目的

Next.js（App Router）+ Prisma 7 + Supabase でフルスタックを学習する。  
バーコード起点の個人インベントリ（当面は消耗品）。  
**スキャン → 照会 → 登録 → 一覧 → 一般登録／リセット → UI／一括 API／UT** まで到達。

## リポジトリ / 環境

| 項目   | 内容                                                     |
| ------ | -------------------------------------------------------- |
| パス   | `C:\Users\isisa\worspace\sample_202610_01`               |
| GitHub | `tofu0308/sample_202610_01`（`main`、origin と同期想定） |
| 本番   | https://sample-202610-01.vercel.app/                     |
| DB     | Supabase PostgreSQL（ローカルと Vercel で同一 DB）       |
| 秘密   | `.env` のみ（値はチャットに出さない）                    |
| 学習メモ | `C:\Users\isisa\Downloads\ルトラ\docs\課題対応\課題対応_20261016.md` |

### 必要な env（名前だけ）

- DB: `DATABASE_URL` / `DIRECT_URL`
- Yahoo: `YAHOO_APP_ID`
- Auth: `NEXT_PUBLIC_SUPABASE_URL`（`https://xxx.supabase.co` まで。`/rest/v1` は付けない）
- Auth: `NEXT_PUBLIC_SUPABASE_ANON_KEY`（Publishable / anon）
- Auth: `ADMIN_EMAIL`（将来の管理用。**アプリ利用ゲートには使わない**）

## 起動・チェック

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

## 直近セッションでやったこと（2026-10-15〜16）

| 領域 | 内容 | 学習メモ |
| --- | --- | --- |
| UI | ダーク＋Geist、スキャン操作、登録後スクロール／クリア、一覧更新バナー、一括バー／主ボタン／行タッチ | §22 |
| リファクタ | overlay・行操作・サムネ分割、`useItemsTable` 分割、scan 葉は render prop、list-refresh 抽出 | §23 |
| 一括 API | `/api/items/bulk`（PATCH 残量／DELETE／POST まとめて登録）。`createUserItemFromSnapshot` 共通化 | §24 |
| UT / coverage | request・スキーマ・DTO・Prisma mock。`include: src/lib/**/*.ts` + exclude | §25 |
| CI | `use-items-table` の ref、`use-list-refresh-after-register` の effect setState を修正 | §26 |

主なコミット例（新しい順）: `fix lint error` → `テスト追加` → `scanとitemsの依存を緩和` → `hooksの分割` → `一括操作系のAPIリファクタ` → コンポーネント整理系。

## 完了済み（現状）

| 領域       | 内容 |
| ---------- | ---- |
| 基盤       | Next.js 16 + Prisma 7 + Vercel + GitHub Actions CI |
| スキャン   | 単体／連続、Yahoo 照会、読取リスト（JAN コピー＋登録） |
| DB / API   | `Product` + `UserItem`。items CRUD + **`/api/items/bulk`** + lookup |
| 一覧       | 残量（`status1`）・メモ・検索・一括・PC は枠内スクロール＋ sticky |
| 認証       | `/signup`・確認メール・一般利用可・リセット・Profile・「○○さん」 |
| エラー     | `error.tsx` / `throwAppError`。想定内失敗はインライン |
| テスト     | Vitest。coverage は lib 純関数中心（Route / hooks / UI は対象外） |
| 学習メモ   | `課題対応/課題対応_20261016.md` §14〜§26 |

設計の正本: `DESIGN_BARCODE_SCAN.md`（登録 §13、組織 §14、エラー §15、Product 鮮度 §16、UI §17）。

## 構成（触るとき）

```
src/proxy.ts                 # セッション更新＋未ログイン→/login
src/app/login/ signup/ forgot-password/ update-password/
src/app/auth/callback/       # code → セッション＋ Profile
src/app/error.tsx            # 想定外／throwAppError
src/app/logout/
src/lib/auth/                # require-user / ensure-profile / profile-schemas
src/lib/errors/app-error.ts  # throwAppError
src/lib/products/            # yahoo-shopping / sync-product-from-lookup / product-lookup-request
src/lib/items/               # schemas / bulk-request / create-user-item-from-snapshot 等
src/lib/scan/                # normalize / constants / scroll-to-element-id
src/lib/supabase/
src/components/auth|scan|items|ui/
src/hooks/scan|items/        # use-items-table-* / use-list-refresh-after-register 等
src/app/api/products/lookup/
src/app/api/items/           # route.ts + bulk/route.ts
```

| 画面ラベル | DB / コード |
| ---------- | ----------- |
| 残量       | `status1`（`STATUS1_OPTIONS`） |
| メモ       | `note` |
| ユーザー   | Auth uid → `UserItem.userId` |
| 表示名     | `Profile.username`（「○○さん」） |
| 商品マスタ | `Product`（Table Editor で確認。Auth ではない） |

## 認証・データ方針（重要）

- 認証: 確認済みログインなら利用可（`ADMIN_EMAIL` はゲートに使わない）
- データの問い合わせ: **Auth uid** で自分の行だけ
- パスワードリセット: `/forgot-password` → callback → `/update-password`
- 組み込みメールはおおむね **1 時間 2 通**（Rate Limits）。学習メモ §16
- Product: 照会成功時に表示用更新。外部で JAN が取れなくても所持は消さない（§16／学習メモ §21）
- URL に `/rest/v1` を付けない（`env.ts` で正規化）
- 単件登録後の一覧の遅さは主に `router.refresh()`（楽観的更新は未着手。§22）

## 次にやること

1. UI 改修の残り（設計書 §17）: B4/B5、D7–D11、E5、F2–F4 など
2. （区切り検討）登録の体感短縮。失敗時に一覧を戻すケアを決めてから
3. （任意）ページネーション、`status2`/`3`（一括 API は `/api/items/bulk` 済み）
4. （将来）組織単位。第1弾では触らない

## 作業の進め方（エージェント向け）

- **commit / push は「commit して」「push して」など明示時だけ**
- 秘密情報をチャット・commit に出さない。MCP Supabase は read-only
- 変更は依頼範囲に限定
- Next.js 16 → `AGENTS.md` と `node_modules/next/dist/docs/`（Proxy は `src/proxy.ts`）
- 学習メモは **`課題対応_20261016.md`** に追記（確認のうえ）。返答は日本語・簡潔。選定理由は短く

## 注意

- 旧 Note CRUD・`local-dev-user` は削除済み
- 生成クライアント `src/generated/prisma` は gitignore（`prisma generate`）
- `AUTH_SIGNUP_WORK_UNITS.md` は完了済みの一時工程表（削除してよい）
- 学習メモの旧パス `docs/課題対応_20261015.md` は使わない（`docs/課題対応/` 配下へ移動済み）
