# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 次セッションへの引き継ぎ用。内容を別メモへ移したあと、または不要になったら **このファイルごと削除する**。  
> 恒久ドキュメントではない。秘密情報（接続文字列・キーの値）は書かない。  
> 次スレッドに貼ったあとも、リポジトリに残す必要がなければ削除してよい。

最終更新: 2026-10-08（管理者ログイン縦スライスまで）

---

## 新スレッドに貼る用（要約）

```text
リポ: C:\Users\isisa\worspace\sample_202610_01
本番: https://sample-202610-01.vercel.app/
設計: docs/DESIGN_BARCODE_SCAN.md
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261008.md（§10〜§12）

完了: スキャン→登録→一覧編集／検索・一括／残量バー
      管理者ログイン（Supabase Auth・公開登録なし・ADMIN_EMAIL）
次: .env に Supabase URL/anon・ADMIN_EMAIL を入れ、Dashboard で自分のユーザー作成
      既存 UserItem の userId（local-dev-user）を Auth uid へ付け替え
      （任意）一般ユーザー登録フロー・一括API・ページネーション
注意: commit/push は明示依頼時のみ。秘密は .env のみ。MCP Supabase は read-only。
```

---

## 目的

Next.js（App Router）+ Prisma 7 + Supabase でフルスタックを学習する。  
バーコード起点の個人インベントリ（**当面は消耗品メイン**）へ向けて **スキャン → Yahoo 照会 → DB 登録 → 一覧で状態管理** まで一通り通した。

## リポジトリ / 環境

- パス: `C:\Users\isisa\worspace\sample_202610_01`
- GitHub: `tofu0308/sample_202610_01`
- 本番 URL: https://sample-202610-01.vercel.app/
- 秘密情報は `.env` のみ。MCP Supabase は read_only

## 起動

```bash
cd C:/Users/isisa/worspace/sample_202610_01
npm run dev
```

```bash
npm run lint
npm run typecheck
npm run test
```

## 完了済み（2026-10-08 時点）

| 領域 | 内容 |
|---|---|
| 基盤 | Next.js 16 + Prisma 7 + Vercel + CI |
| スキャン | 単体／連続、Yahoo 照会、読取リスト（JAN コピー＋登録） |
| DB / API | `Product` + `UserItem`。`GET/POST/PATCH/DELETE /api/items` |
| 一覧 | 表・残量ソート／バー・メモバルーン・更新日・検索・一括操作 |
| 分割 | `lib` / `hooks` / `components/items|scan` |
| 認証 | Supabase Auth。`/login`・Proxy・`ADMIN_EMAIL`。公開サインアップ UI なし |

学習メモ: `課題対応_20261008.md` §10〜§13。

## 構成（触るとき）

```
src/components/scan/     # barcode-scanner + 読取リスト等
src/components/items/    # 表・検索・一括バー・メモ・残量メーター
src/hooks/scan|items/
src/lib/scan|items|products/
src/app/api/products/lookup/
src/app/api/items/
```

- 一覧フロー: `hooks/items/use-items-table.ts`
- 残量候補: `lib/items/constants.ts`（`STATUS1_OPTIONS`）
- 画面ラベル「残量」「メモ」⇔ カラム `status1` / `note`

## 管理者ログインのセットアップ（手元）

1. Supabase Dashboard → Authentication → Users で **自分のユーザーを作成**（アプリから登録しない）
2. `.env` / Vercel に追加（値はチャットに書かない）  
   - `NEXT_PUBLIC_SUPABASE_URL`  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - `ADMIN_EMAIL`（自分のメール）
3. ログイン後、Auth の **User UID** を確認し、既存データを付け替え:

```sql
-- 例（uid は自分のものに置換）
UPDATE "UserItem"
SET "userId" = '<auth-uid>'
WHERE "userId" = 'local-dev-user';
```

## 次にやること（優先・任意）

1. 上記セットアップと既存データ付け替えの動作確認
2. 一般ユーザー向け登録フロー（招待・サインアップ）の設計
3. まとめて登録／一括 PATCH・DELETE の **一括 API**
4. ページネーション / `status2`・`3` / カテゴリ探索

## 作業の進め方（エージェント向け）

- **commit / push は「commit して」「push して」など明示時だけ**
- 秘密情報をチャットに出さない
- 返答は日本語・簡潔。依頼範囲外のリファクタしない
- Next.js は `AGENTS.md` / `node_modules/next/dist/docs/` を優先

## 注意

- Note モデルは削除済み（`UserItem.note` はメモ欄）
- アフィリエイトは当面なし
