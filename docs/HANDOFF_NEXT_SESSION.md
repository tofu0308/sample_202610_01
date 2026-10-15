# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 新スレッド開始時に下の「貼る用」をコピーして渡す。恒久ドキュメントではない。  
> 秘密情報（接続文字列・キーの値・パスワード）は書かない／チャットにも出さない。  
> 不要になったらこのファイルごと削除してよい。

最終更新: 2026-10-15

---

## 新スレッドに貼る用（要約）

```text
【引き継ぎ】消耗品インベントリ学習アプリ

リポ: C:\Users\isisa\worspace\sample_202610_01
GitHub: tofu0308/sample_202610_01（main）
本番: https://sample-202610-01.vercel.app/
設計: docs/DESIGN_BARCODE_SCAN.md
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261015.md
  （Auth・エラー・Product・UI。作業内容は節タイトルで追える）
作業単位 Auth: docs/AUTH_SIGNUP_WORK_UNITS.md（U1〜U13 完了・削除可）
この引き継ぎ: docs/HANDOFF_NEXT_SESSION.md

スタック: Next.js 16 App Router + Prisma 7 + Supabase(PostgreSQL) + zod + Vitest
目的: バーコード → Yahoo 照会 → DB 登録 → 一覧で残量・メモ管理（消耗品メイン）

【到達済み（体裁は一通り）】
- スキャン（単体／連続）+ Yahoo 照会 + 登録一覧（残量・メモ・検索・一括）
- Auth: /signup・確認メール・callback・Profile・一般利用可・「○○さん」
  /forgot-password → /update-password、local-dev-user 削除済み
- エラー: error.tsx + throwAppError（想定内はインライン）
- Product: 照会成功時にマスタ表示用を更新（見つからなくても所持は消さない）
- UI 改修: 体裁・文言、スキャン／登録の振る舞い、待ち表示、一括バー／主ボタン／行タッチ（学習メモ §22〜§25）

【次にやること（優先は任意）】
1. UI 改修の残り（余裕）: auth 導線・alert、overlay Escape／余白、未ヒット案内、削除確認、Logout／入力スタイルなど
2. （区切り検討）登録の体感短縮（楽観的更新）。失敗時ロールバック方針を決めてから
3. （任意）ページネーションなど（一括 API は `/api/items/bulk` 済み）
4. （将来）組織単位。第1弾では触らない
※ 確認メール再送 UI、フォームを noValidate+zod に寄せるかは後で検討

【エージェントへの注意】
- commit / push は「commit して」「push して」など明示時だけ
- 秘密は .env のみ。MCP Supabase は read-only のまま
- 変更は依頼範囲に限定。Next は AGENTS.md と node_modules/next/dist/docs/ を優先
- 学習メモへの長文追記は、内容確認してから（勝手に長く書かない）
- 返答は日本語・簡潔。学習モードなので選定理由を短く
```

---

## 目的

Next.js（App Router）+ Prisma 7 + Supabase でフルスタックを学習する。  
バーコード起点の個人インベントリ（当面は消耗品）。  
**スキャン → 照会 → 登録 → 一覧 → 一般登録／リセット** まで到達。体裁は一通り整った。

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
```

## 完了済み（現状）

| 領域       | 内容 |
| ---------- | ---- |
| 基盤       | Next.js 16 + Prisma 7 + Vercel + GitHub Actions CI |
| スキャン   | 単体／連続、Yahoo 照会、読取リスト（JAN コピー＋登録） |
| DB / API   | `Product` + `UserItem`。items CRUD + lookup。照会成功時に Product 更新 |
| 一覧       | 残量（`status1`）・メモ・検索・一括・PC は枠内スクロール＋ sticky |
| 認証       | `/signup`・確認メール・一般利用可・リセット・Profile・「○○さん」 |
| エラー     | `error.tsx` / `throwAppError`。想定内失敗はインライン |
| 学習メモ   | `課題対応_20261015.md` §14〜§22 |

設計の正本: `DESIGN_BARCODE_SCAN.md`（登録 §13、組織 §14、エラー §15、Product 鮮度 §16）。

## 構成（触るとき）

```
src/proxy.ts                 # セッション更新＋未ログイン→/login
src/app/login/ signup/ forgot-password/ update-password/
src/app/auth/callback/       # code → セッション＋ Profile
src/app/error.tsx            # 想定外／throwAppError
src/app/logout/
src/lib/auth/                # require-user / ensure-profile / profile-schemas
src/lib/errors/app-error.ts  # throwAppError
src/lib/products/            # yahoo-shopping / sync-product-from-lookup
src/lib/supabase/
src/components/auth|scan|items/
src/hooks/scan|items/
src/app/api/products/lookup/
src/app/api/items/
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

## 次にやること

1. UI 改修の残り（余裕）: auth 導線・alert、overlay Escape／余白、未ヒット案内、削除確認、Logout／入力スタイルなど
2. （区切り検討）登録の体感短縮。失敗時に一覧を戻すケアを決めてから
3. （任意）ページネーション、`status2`/`3`（一括 API は `/api/items/bulk` 済み）
4. （将来）組織単位。第1弾では触らない

## 作業の進め方（エージェント向け）

- **commit / push は「commit して」「push して」など明示時だけ**
- 秘密情報をチャット・commit に出さない。MCP Supabase は read-only
- 変更は依頼範囲に限定
- Next.js 16 → `AGENTS.md` と `node_modules/next/dist/docs/`（Proxy は `src/proxy.ts`）
- 学習メモ追記は確認のうえ。返答は日本語・簡潔。選定理由は短く

## 注意

- 旧 Note CRUD・`local-dev-user` は削除済み
- 生成クライアント `src/generated/prisma` は gitignore（`prisma generate`）
- `AUTH_SIGNUP_WORK_UNITS.md` は完了済みの一時工程表（削除してよい）
