# 引き継ぎメモ（次セッション用）

> **一時メモ（削除前提）**  
> 次セッションへの引き継ぎ用。内容を別メモへ移したあと、または不要になったら **このファイルごと削除する**。  
> 恒久ドキュメントではない。秘密情報（接続文字列・キーの値）は書かない。  
> 次スレッドに貼ったあとも、リポジトリに残す必要がなければ削除してよい。

最終更新: 2026-10-08（一覧 UI 強化・検索・一括操作まで反映）

---

## 新スレッドに貼る用（要約）

```text
リポ: C:\Users\isisa\worspace\sample_202610_01
本番: https://sample-202610-01.vercel.app/
設計: docs/DESIGN_BARCODE_SCAN.md
学習メモ: C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261008.md（§10〜§12）

完了: スキャン→Yahoo照会→DB登録／一覧・削除・残量(status1)・メモ編集
      残量プリセット＋バー／一括選択・適用・削除／フリーワード検索
      スキャンUIは読取リスト＋JANコピーに統一／PC表は枠内縦横スクロール＋見出し固定
次（任意）: 一括API・ページネーション・status2/3・カテゴリ探索・認証
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

学習メモの詳細: `課題対応_20261008.md` §10（migrate）§11（登録）§12（一覧強化）。

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

## 次にやること（優先・任意）

1. まとめて登録／一括 PATCH・DELETE の **一括 API**（いまは単件順呼び）
2. 件数が増えたら **ページネーション**（いまは全件）
3. `status2` / `status3` / `remaining` の本利用・プリセット UI
4. カテゴリ探索登録（塗料 `category_id` 未決）
5. 認証（仮 `DEV_USER_ID` → 本番 uid）

## 作業の進め方（エージェント向け）

- **commit / push は「commit して」「push して」など明示時だけ**
- 秘密情報をチャットに出さない
- 返答は日本語・簡潔。依頼範囲外のリファクタしない
- Next.js は `AGENTS.md` / `node_modules/next/dist/docs/` を優先

## 注意

- Note モデルは削除済み（`UserItem.note` はメモ欄）
- アフィリエイトは当面なし
