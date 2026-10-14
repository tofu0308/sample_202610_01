# 設計書（一時）: バーコード起点の個人インベントリ（消耗品）

> **一時メモ（削除前提）**  
> 設計・進捗の作業用。方針が学習メモへ移ったあと、または機能が落ち着いたら **このファイルごと削除する**。  
> 恒久ドキュメントではない。秘密情報（接続文字列・キーの値）は書かない。

進捗は本ファイルのチェックリストと学習メモで管理する。  
学習メモ: `C:\Users\isisa\Downloads\ルトラ\docs\課題対応_20261014.md`  
最終更新: 2026-10-14（一般登録・リセット実装）

---

## 1. 目的

バーコードで商品を調べ、所持を DB に登録し、残量・メモを管理する学習用アプリ（当面は消耗品メイン）。

到達済み: **スキャン → Yahoo 照会 → 登録 → 一覧編集 → 一般登録／リセット**（§13）。`local-dev-user` 削除済み。  
次: （任意）強化・組織単位は将来（§14）。

学習ポイント（累積）:

- Client Component でのデバイス API（カメラ）利用
- Route Handler + zod + Prisma（境界検証・所持 CRUD）
- Supabase Auth（Proxy・Profile・uid でデータ分離・確認／リセットメール）

---

## 2. スコープ

### やる（Phase 1）

- [x] Notes **同一ページ**にスキャン用セクションを置く
- [x] 「スキャン開始」等の **ボタン操作でカメラを起動**する（ページ遷移なし）
- [x] カメラで QR / 1D バーコードを読み取る（実装済み・実機確認は §7）
- [x] 読取結果（文字列・可能なら形式・読取時刻）を同ページ上に表示する
- [x] 「停止」でカメラを止める
- [x] カメラ権限拒否・非対応時のメッセージを出す
- [x] 権限失敗・検証用の **最小限の手動入力**（PC 本対応ではない）
- [x] 実機（スマホ）で動作確認する（iPhone）

### やらない（Phase 1 / 共通）

- 専用ルート `/scan` の追加（必要になったら切り出し）
- 認証 / ユーザー別データ
- PC ハンディスキャナ向けの本格 UI
- **アフィリエイト URL の発行・表示**（当面なし）
- E2E / カメラモックの重い自動テスト（任意・低優先）

---

## 3. 前提・制約

| 項目 | 内容 |
|---|---|
| 優先端末 | スマホ（iOS / Android ブラウザ） |
| PC | 優先度低。手動の数字・文字列入力で足りる範囲のみ |
| UI | **同一ページ**。ボタン tap 後にカメラ起動（自動起動しない） |
| サーバ / DB | Phase 1 では変更しない（クライアント完結） |
| 秘密情報 | 追加の API キーは想定しない |
| commit / push | ユーザー明示時のみ |
| カメラ | 多くのブラウザは **HTTPS または localhost** が必要 |
| 実機確認 | **手元は iPhone（Safari）を主**。Android も一般に可と想定し、端末が手元にない間は未確認のまま進める |
| 確認 URL | Vercel 本番 URL が確実（同一 Wi-Fi の `next dev` は環境次第） |

---

## 4. 方針（選定）

### 4.1 読み取りライブラリ

| 候補 | 利点 | 留意 |
|---|---|---|
| `@zxing/library` + `@zxing/browser` | QR / 各種バーコード幅広、実績が多い | バンドル・API の確認が必要 |
| `html5-qrcode` | 導入例が多い、UI 付き / 自前 UI 両対応 | 原版はメンテ停滞気味。学習・見覚え優先で採用 |
| BarcodeDetector API（ネイティブ） | 依存少 | ブラウザ対応が限定的 → 単体採用は非推奨 |

**決定:** `html5-qrcode`（npm パッケージ名同じ。API は `Html5Qrcode` を使い自前の開始/停止ボタンに合わせる）

選定理由:

1. 利用者に見覚えがあり、学習・デバッグしやすい
2. QR と 1D バーコードの両方に対応している
3. `Html5Qrcode`（UI なし API）なら、同一ページ＋ボタン起動の方針に合わせやすい

補足:

- 組み込み UI の `Html5QrcodeScanner` は使わず、**自前ボタンで start / stop** する
- 原版の長期メンテに不安が出たら、後で `@zxing/browser` やメンテ中フォークへ差し替え可能（読取結果の型は共通化しておく）

### 4.2 UI 配置（決定）

- **ルート追加なし。** トップ（`/` = Notes）にスキャンセクションを置く
- コンポーネント: `BarcodeScanner`（`"use client"`）に  
  開始ボタン・結果表示・手動入力を集約
- トップ `page.tsx`（Server Component）から上記 Client を import して配置
- Note の作成・一覧ロジックは触らない（セクション追加のみ）
- カメラ起動中は **画面全体を覆うオーバーレイ**（スクロール不要）
- **商品ヒット時だけ**オーバーレイを自動クローズし、商品情報へスクロール。未ヒットはオーバーレイに残す（「結果を見る」で降りられる）。中止は「キャンセル」
- **PC（`md` 以上）ではスキャン UI を非表示**（スマホ優先。手動入力も同セクション）
- 後からフローが長くなったら `/scan` 等へ切り出す（Phase 1 ではやらない）

### 4.3 読取結果の形（案）

```ts
type ScanResult = {
  rawValue: string; // 読み取った文字列
  format?: string; // 例: "QR_CODE" / "EAN_13"（ライブラリ依存）
  scannedAt: string; // ISO 8601
};
```

- 連続読取: 同一 `rawValue` の再表示を短時間抑止する（チラつき防止）
- Phase 1 では永続化しない（リロードで消えてよい）

---

## 5. 画面仕様

### 5.1 Notes トップ内「スキャン」セクション

配置案（上から）:

1. ヘッダ（既存）
2. **スキャン**（新規）
3. 新規作成（既存）
4. 一覧（既存）

スキャンセクションの内容:

1. 見出し + 短い説明（カメラ許可が必要な旨）※ `md:hidden`
2. 「スキャン開始」→ **全画面オーバーレイ**でカメラ起動
3. オーバーレイ内「閉じる」でストリーム解放＋オーバーレイ終了
4. 読取成功時はオーバーレイ下部にも結果を表示。閉じたあともページ内「読取結果」に残る
5. フォールバック: テキスト入力 + 「表示」ボタン（スマホ幅のみ）
6. エラー: 権限拒否、カメラなし、読取ライブラリ初期化失敗

### 5.2 導線

- 別ページへのリンクは置かない
- スクロールでスキャンセクションに到達できればよい  
  （任意: ページ内アンカー `#scan`）

---

## 6. 変更ファイル一覧（予定）

| 操作 | パス | 内容 | 状態 |
|---|---|---|---|
| 追加 | `src/components/scan/barcode-scanner.tsx` ほか | Client。開始/停止・カメラ・結果・手動入力（浅い分割） | 済 |
| 変更 | `src/app/page.tsx` | スキャンセクションとして `BarcodeScanner` を配置 | 済 |
| 変更 | `package.json` / lockfile | `html5-qrcode` | 済 |
| 追加しない | `src/app/scan/**` | 専用ページは Phase 1 対象外 | — |
| 変更なし | `prisma/**`, `src/app/api/**`, `src/lib/note-*` | Phase 1 対象外 | — |
| 更新 | 本ファイル | 決定事項・チェックリスト進捗 | 進行中 |

（実装時にパスがずれたら本表を更新する）

---

## 7. 非機能・確認観点

- [ ] iPhone Safari で QR を読める（主検証）
- [ ] iPhone Safari で 1D（例: EAN-13 / JAN）を読める（主検証）
- [ ] （任意・端末あれば）Android Chrome でも同様
- [ ] 権限拒否時にアプリが固まらない
- [ ] 停止後にカメラインジケータが消える（ストリーム解放）
- [x] `npm run lint` / `npm run typecheck` が通る

対応コード種別のメモ（実機後に記入）:

- 検証端末: iPhone / Safari（実機確認済み 2026-10-07）
- QR: 読取可
- バーコード: 読取可

---

## 8. Phase 2 — 外部 API で商品特定（方針決定）

### 8.1 目的

読取コード（主に JAN）を外部 API に問い合わせ、**プラモデル塗料などホビー商品の名称などを表示**する。  
アフィリエイトは出さない。DB マスタ本格保存は必須にしない（未ヒット補完は後続可）。

### 8.2 やること / やらないこと

**やる**

- [ ] 読取成功（または手動入力）後に商品照会を走らせる
- [ ] **サーバー側**（Route Handler）から外部 API を呼ぶ（アプリ ID を Client に出さない）
- [ ] ヒット時: 商品名（＋あれば画像・ジャンル）を表示
- [ ] ミス時: 「商品情報が見つかりませんでした」を表示
- [ ] データ出典の短いクレジット（例: Yahoo!ショッピング）

**やらない**

- アフィリエイトリンクの表示・誘導（`affiliate_type` 等は付けない）
- スクレイピング・一括クロール
- 認証・ユーザー別

### 8.3 外部 API 選定

| 候補 | 塗料 JAN との相性 | 留意 |
|---|---|---|
| Open Food Facts | 不向き（食品） | 除外 |
| ヨドバシ | — | 一般向け公開 API なし |
| Amazon Creators API | カタログは厚い | アソシエイト・実績条件など重い → 見送り |
| 楽天 製品検索 | 有力 | 好みで不採用 |
| **Yahoo!ショッピング 商品検索 v3** | **採用**。`jan_code` 専用あり | Client ID 必須（無料登録） |
| 自前マスタ | 未ヒット補完 | Phase 2b |

**決定:** Yahoo!ショッピング **商品検索 API（v3）**  
- エンドポイント例: `https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch`  
- 入力: `appid` + `jan_code`  
- 出力: 商品名（`name` 等）・画像。アフィ用パラメータは送らない  

選定理由:

1. JAN 専用パラメータがあり塗料・ホビー向き  
2. 楽天より好みに合う  
3. 商品検索は Yahoo! ID 連携なしで Client ID だけで呼べる（公式案内）

期待値: Yahoo!ショッピングに出品がある塗料は当たりやすい。未出品 JAN は未ヒット → 自前マスタ（2b）を検討。

### 8.3b 登録作業（ユーザー側・必要）

**必要です。** コードだけでは呼べません。

1. [Yahoo! JAPAN ID](https://www.yahoo-help.jp/app/home/p-2801) を用意（なければ作成）
2. [Yahoo!デベロッパーネットワーク](https://developer.yahoo.co.jp/) でログイン
3. **アプリケーションを登録** → **Client ID（アプリケーションID）** を取得  
   - 利用者区分に「個人」があればそれを選ぶ。画面によっては **屋号欄が必須**になる（実地で確認済み）
   - 屋号が無い場合: 学習用に **氏名を入れる**か、Yahoo 登録を後回しにして自前マスタへ
   - 商品検索用途。ストア運営用の追加申請は **今回は不要**
4. `.env` にだけ書く（チャット・Git に載せない）  
   - 例: `YAHOO_APP_ID=...`  
5. Vercel で実機確認するなら、同じ変数を Vercel の Environment Variables にも設定

利用時の目安: ガイドライン同意、レート制限（公式に 1 クエリ/秒 などの記載あり）。連続スキャンではサーバ側で間を空ける。

### 8.4 アプリ内フロー（案）

```text
スキャン or 手動入力
  → rawValue を表示（Phase 1 どおり）
  → POST /api/products/lookup { code }（zod 検証）
  → サーバが Yahoo itemSearch を GET（appid は env、jan_code=code）
  → 画面に name / image（あれば）or 未ヒット
  → アフィ関連パラメータ・URL は使わない
```

環境変数（値は `.env` / Vercel のみ）:

- `YAHOO_APP_ID`（必須・Client ID）

### 8.5 変更ファイル（予定）

| 操作 | パス | 内容 |
|---|---|---|
| 追加 | `src/app/api/products/lookup/route.ts` | code 検証 → Yahoo 照会 → JSON |
| 追加 | `src/lib/products/yahoo-shopping.ts` | fetch ラッパ・型・エラー正規化 |
| 追加 | `src/lib/products/product-lookup-schemas.ts` | zod |
| 変更 | `src/components/scan/*` | lookup・結果表示（アフィ無し） |
| 変更 | `.env.example` | `YAHOO_APP_ID=` の説明のみ |
| 更新 | 本ファイル / 学習メモ | 進捗 |

Prisma / Note API は触らない（Phase 2 の最小）。

### 8.6 レスポンス形（アプリ向け・案）

```ts
type ProductLookupResponse =
  | {
      found: true;
      code: string;
      name: string;
      imageUrl?: string;
      source: "yahoo_shopping";
    }
  | { found: false; code: string; source: "yahoo_shopping" };
```

---

## 8b. フェーズ一覧（更新）

| Phase | 内容 | 状態 |
|---|---|---|
| 1 | カメラ読取 → 画面表示 | **完了** |
| 2 | Yahoo JAN 照会 → 商品名表示 | **完了** |
| 2.5 | 連続スキャン | **完了** |
| 3 | 所持の DB 管理・一覧編集（下記 §11） | **完了**（3c カテゴリ探索・status2/3 本利用は任意で未） |
| 4 | 認証（管理者ログイン・uid 分離） | **完了**（公開サインアップは未。下記 §12） |
| 4.5 | 一般ユーザー向け登録フロー | **設計合意**（下記 §13。実装が次） |
| 5 | PC ハンディスキャナ本対応 | 未着手 |
| - | 未ヒット用の自前マスタ拡充 | 任意 |
| - | アフィリエイト | **当面なし** |

---

## 9. 進捗チェックリスト（Phase 1）

### 設計

- [x] スコープ・やらないこと整理
- [x] 一時設計書作成（本ファイル）
- [x] UI: 同一ページ＋ボタン起動に決定
- [x] ライブラリ決定と選定理由の記入（`html5-qrcode`）

### 実装

- [x] ライブラリインストール（`html5-qrcode`）
- [x] `BarcodeScanner` コンポーネント（開始/停止・プレビュー・結果）
- [x] Notes トップへセクション配置
- [x] 手動入力フォールバック
- [x] エラーハンドリング（権限など）+ 停止時のストリーム解放

### 確認

- [x] lint / typecheck（2026-10-07 通過）
- [x] 実機確認（iPhone・結果は §7）
- [x] 学習メモ追記（`課題対応_20261007.md` §7）

### クローズ

- [x] Phase 1 の実装・実機は完了（UI は全画面オーバーレイ＋ PC 非表示）
- [ ] commit / push はユーザー明示時のみ

---

## 9b. 進捗チェックリスト（Phase 2）

### 設計

- [x] アフィリエイトは当面なし
- [x] 用途 = プラモデル塗料等 → Open Food Facts / ヨドバシ公開 API は不向き
- [x] 外部 API = Yahoo!ショッピング商品検索 v3（`jan_code`）に決定
- [x] Yahoo Client ID 発行（ユーザー作業）
- [x] 学習メモに Yahoo!デベロッパーネットワーク知見を追記（`課題対応_20261007.md` §8）

### 実装

- [x] `yahoo-shopping` ラッパ + zod
- [x] `POST /api/products/lookup`
- [x] `BarcodeScanner` から照会・結果表示（アフィ無し）
- [x] 出典クレジット表示
- [x] `.env.example` 更新
- [ ] `.env` / Vercel に `YAHOO_APP_ID` を設定（ユーザー・値はチャットに出さない）
- [x] lint / typecheck / スキーマテスト（2026-10-07）
- [ ] 実機: 手元の塗料 JAN でヒット / 未登録で未ヒットメッセージ

---

## 9c. 進捗チェックリスト（連続スキャン）

- [x] 単体 / 連続トグル（カメラ起動中は切替不可）
- [x] 連続時はカメラ維持・待ちリスト追加
- [x] JAN 正規化後の重複排他（件数に入れない・通知のみ）
- [x] 商品照会はキューで直列（二重照会で結果を潰さない）
- [x] オーバーレイは件数＋直近 1 件（カメラ領域を確保）
- [x] 終了後リストにサムネ・商品名（スクロール可）
- [x] あわせて浅いディレクトリ整理（`scan` / `notes` / `products`、`__tests__/`）
- [x] lint / typecheck / test（2026-10-07）
- [x] 学習メモ追記（`課題対応_20261007.md` §9）
- [ ] 実機再確認（重複 JAN・複数件読取）

---

## 10. エージェント向けメモ

- Note モデル / API / UI は削除済み。`UserItem.note` はメモ欄として残置
- Yahoo 照会は Route Handler 経由（`YAHOO_APP_ID` はサーバのみ）。アフィリエイトなし
- カテゴリは **塗料配下だけ**階層 API（未実装・任意）。全カテゴリの一括取得・DB 全件保存はしない
- 認証は一般登録・リセットまで完了（§13）。組織は将来（§14）
- `UserItem.userId` は Auth uid（旧 `local-dev-user` は削除済み）
- 専用 `/scan` は作らない（この設計の範囲）
- カメラはボタン操作後に起動する（マウント時の自動起動はしない）
- Client 肥大化時は hooks / lib 分離。無関係なリファクタはしない
- MCP Supabase は read-only。DB 変更は Prisma migrate
- 秘密情報をチャットや commit に出さない。commit / push は明示時のみ
- Next.js 16 → `AGENTS.md` と `node_modules/next/dist/docs/`（Proxy は `src/proxy.ts`）
- 進捗を進めたら **本ファイルのチェックと学習メモを更新**する

---

## 11. Phase 3 — 所持管理（汎用モデル・要件・DB）

### 11.1 解決する課題

バーコード付きの「もの」の **所持状況をデータ管理**したい。

プロダクトの捉え方: **バーコード起点の個人インベントリ**。当面は **消耗品メイン**（重複購入・残量の把握）。

| モード（将来） | 例 | いま |
|---|---|---|
| **消耗品系** | 塗料・絵の具・調味料・洗剤・トイレットペーパー等 | **ここを主戦場** |
| **永続系** | 書籍（未読/読了）・コレクション等 | 将来。モード／プリセットで分ける想定 |

最初の具体例はプラモデル用塗料。スキーマは汎用のまま、ドメイン固有はプリセット側に寄せる。

### 11.1b 汎用化とプリセット（方針）

| 層 | 役割 | 3a |
|---|---|---|
| `Product` | 商品マスタ（JAN 一意）。ドメイン非依存 | 入れる |
| `UserItem` | ユーザーの所持 1 件（旧称 `UserPaint`）。状態はここ | 入れる |
| `presetKey` | 用途の識別子（例: `paint` / `seasoning` / 将来 `book`） | 列だけ。初期値は `paint` でよい |
| ステータスプリセット | 用途ごとの選択肢・ラベル（DB の enum にはしない） | **後続**。値は当面 `String?` |
| 消耗 / 永続モード | UI・候補・文言の切替（将来） | **やらない**。設計メモのみ |

プリセットのイメージ（アプリ設定・将来。DB テーブル必須ではない）:

| presetKey | 系統 | status1 の例（ラベル） | 備考 |
|---|---|---|---|
| `paint` | 消耗 | 所持中 / 残少 / 使い切り | **初期ユースケース** |
| `seasoning` 等 | 消耗 | 未開封 / 開封済 / 要補充 | 日用品へ横展開 |
| `book` | 永続 | 未読 / 読書中 / 読了 | 将来モード |

- `status1`〜`status3` は **自由な文字列（null 可）**のまま。プリセットは「UI が差し出す候補」であって、列型を用途ごとに分けない
- 初期 UI は `status1` のみ。候補リストは `presetKey` に応じて後から差し替え可能にする
- 3a ではプリセット UI・モード切替は作らない（スキーマと命名だけ汎用。画面・文言は消耗品前提でよい）

### 11.2 やりたいこと（暫定）

| # | 内容 | 備考 |
|---|---|---|
| 1 | ユーザーは登録を経て、ログイン時に自分のデータを管理できる | **認証は Phase 4**。DB はユーザー単位を前提に設計 |
| 2 | 保持状況をユーザー単位で登録・編集できる | `UserItem` |
| 3 | 残量などを編集し、買い替え・補充の指標にする | `remaining` 等（書籍では使わなくてもよい） |
| 4 | 登録済みアイテムを検索できる | 自 DB 検索 |
| 5 | 登録済みアイテムを削除できる | |
| 6 | バーコードスキャン → 商品情報表示 → そのまま登録 | Phase 2 の延長 |
| 7 | 検索で商品情報を複数件出し、複数選択してまとめて登録 | キーワード / **カテゴリ階層**（初期は塗料配下） |

### 11.3 データ取捨（いまのアプリ型ベース）

#### 読取 `ScanResult`

| 項目 | DB | 判断 |
|---|---|---|
| `rawValue`（JAN） | **残す** | 商品キー |
| `format` | 捨てる（初期） | デバッグ用。必要なら後付け |
| `scannedAt` | 履歴テーブルを作るまで捨てる | 所持中心なら必須ではない |

#### 照会 `ProductLookupResult` / Yahoo

| 項目 | DB | 判断 |
|---|---|---|
| `code`（JAN） | **残す** | `Product.jan` 一意 |
| `name` | **残す** | 店舗タイトル由来。変な名前・宣伝文言がありうる前提。参考表示名／あとで編集可 |
| `brandName` | **残す（任意）** | |
| `imageUrl` | **任意** | 外部 URL は切れうる。初期は持ってもよい |
| `source` | **残す** | `yahoo_shopping` / `manual` |
| 価格・在庫・ストア URL・アフィ | **捨てる** | |
| ジャンル | **任意スナップショット** | 登録時の `genreId` / `genreName` 程度。信頼度は低め |

#### カテゴリ一覧

- Yahoo **カテゴリID取得 API**で階層を辿れる（`category_id=1` がルート）
- アプリでは **塗料配下だけ**を開始点にする（全カテゴリはリクエストしない）
- 大量データを払い出して探させない。**階層を下って商品を探す**
- カテゴリツリー全体は **DB に常時保存しない**（都度 API or 塗料配下の短期キャッシュ）

商品名の注意（実測）: 同一 JAN でも店舗ごとにタイトルが違う（「爆買」「コンパクト便可」等）。  
ジャンルも店によって末端がズレることがある（例: `水性、アクリル` vs `その他模型、プラモデル`）。

### 11.4 一意性

| 制約 | 意味 |
|---|---|
| `Product.jan` `@unique` | **商品マスタ**が JAN でアプリ全体 1 件 |
| `UserItem` の `@@unique([userId, productId])` | **ユーザー単位の登録状況**が一意（二重所持行を防ぐ） |

JAN 一意だけでは「ユーザーごとの登録一意」にはならない。所持は別テーブル（または複合一意）が必要。  
同一 JAN を「塗料コレクション」と「書籍コレクション」で二重に持ちたい場合は、将来 `@@unique([userId, productId, presetKey])` への拡張を検討（3a では userId+productId のみ）。

### 11.5 スキーマ案（Prisma・暫定）

認証前でもカラムを用意し、単一ユーザー運用時は仮の `userId`（定数）でもよい。

```prisma
/// Yahoo 等から得た商品マスタ（JAN 一意）。ドメイン非依存
model Product {
  id         String   @id @default(cuid())
  jan        String   @unique
  name       String
  brandName  String?
  imageUrl   String?
  source     String   // "yahoo_shopping" | "manual"
  genreId    String?  // Yahoo カテゴリ ID（任意）
  genreName  String?  // 末端ジャンル名スナップショット（任意）
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
  userItems  UserItem[]
}

/// ユーザーの所持 1 件。状態はこちら（Product には載せない）
model UserItem {
  id        String   @id @default(cuid())
  userId    String   // Phase 4 で Auth の uid に接続。それまでは仮値可
  productId String
  product   Product  @relation(fields: [productId], references: [id], onDelete: Cascade)
  /// 用途プリセットキー。候補 UI の差替えに使う（例: paint / book）。3a 既定は "paint"
  presetKey String   @default("paint")
  remaining String?  // 残量など。用途によっては未使用でよい
  note      String?  // コメント（任意）
  // 予備ステータス 3 本。いずれも null 可。意味・ラベルは presetKey 側で後から定義
  status1   String?  // 当面 UI で使う 1 本（登録時は未設定のまま可）
  status2   String?  // 予備・未使用可
  status3   String?  // 予備・未使用可
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, productId])
  @@index([userId])
  @@index([userId, presetKey])
}
```

- ユーザー編集（`note` / `status*` / `remaining`）は **UserItem のみ**。商品マスタと混ぜない
- 初期 UI は `status1` だけ表示・編集。`status2` / `status3` は列だけ先に用意
- 登録時はステータス・メモとも全部 null でよい。`presetKey` はサーバ既定 `"paint"` でよい
- プリセット定義（候補値・ラベル）は **コード上の設定**を先に検討。DB にプリセットマスタを置くのは必要になってから

旧 `Note` モデルは削除済み。登録のコメントは `UserItem.note` を使う。

### 11.6 探索 UI 方針（初期は塗料カテゴリ）

```text
開始カテゴリ（用途に応じた固定 category_id。初期は塗料付近）
  → categorySearch で子を表示
  → ユーザーが階層を下る
  → 葉付近で itemSearch(genre_category_id) → 複数件
  → 複数選択 → まとめて UserItem 登録
```

- 開始 ID は定数 or env（Yahoo 側変更でズレうる）。将来は `presetKey` ごとに開始 ID を持てる
- JAN スキャンは別入口（現行フロー）のまま（用途を問わず使える）

### 11.7 実装分割

| Step | 内容 | 状態 |
|---|---|---|
| **3a** | `Product` + `UserItem` migrate。スキャン／照会成功 → 登録。一覧・削除 | **完了** |
| **3b** | 編集: `note` + `status1`。検索・一括操作・残量プリセット／バーも実装済み | **完了**（`status2`/`3`・`remaining` 列の本利用は任意で未） |
| **3c** | カテゴリ階層ブラウズ＋複数選択一括登録（初期は塗料） | 未着手（任意） |
| **3d** | 用途別ステータスプリセット拡張。消耗/永続モード切替は任意 | 一部済み（残量プリセット）。用途切替は未 |
| **4** | Supabase Auth。仮 `userId` を Auth uid に。認可 | **管理者ログインまで完了**（§12）。一般登録は §13 |

優先（当初）: 3a → 3b → 4。**いまの次**: 一般ユーザー登録（§13）と旧データの付け替え確認。

### 11.8 進捗チェックリスト（Phase 3）

### 設計

- [x] 課題・やりたいこと（暫定）を本ファイルに記載
- [x] データ取捨・一意性・スキーマ案
- [x] カテゴリは用途配下のみ／全件 DB 保存しない（初期は塗料）
- [x] ユーザー編集: `note` + `status1`〜`status3`（全て null 可。初期表示は status1 のみ）
- [x] 汎用化: `UserItem` + `presetKey`。ステータス意味はプリセット側（後続）
- [ ] 開始 `category_id` の確定（塗料ルート）
- [ ] `remaining` を自由記述か数値かを決定
- [ ] 各 preset の status 候補値・ラベル（3d。例: book = 未読 / 読書中 / 読了）

### 実装（3a / 3b）

- [x] Prisma migrate（`Product` / `UserItem`）→ `20261008025638_add_product_user_item`
- [x] 登録・一覧・削除 API（`/api/items` GET/POST、`/api/items/[id]` DELETE）
- [x] `PATCH /api/items/[id]`（`note` / `status1`）
- [x] 登録一覧 UI（表・ソート・削除・インライン編集）
- [x] スキャン成功 → 登録導線（単体・連続。まとめて登録は単件 POST 連打）
- [x] 残量プリセット／バー、メモバルーン、更新日 JST、フリーワード検索、一括選択・適用・削除
- [ ] （任意）一括 API（いまは 1 件ずつ PATCH/DELETE）
- [ ] （任意）`remaining`・`status2`/`3` の本利用・ページネーション
- [ ] （3c）カテゴリ階層＋複数選択登録
- [ ] （3d）用途別プリセット拡張

### 11.9 Phase 3a 実装設計（改修用）

> 消耗品メイン。プリセット UI・モード切替・カテゴリ探索は対象外。  
> **編集（note / status）は 3b**（登録完了後）。スキーマ本体は §11.5。ここでは **3a の API / UI / 配置 / 順**。

#### 11.9.1 スコープ

| やる（3a） | やらない（後続） |
|---|---|
| `Product` + `UserItem` の migrate | **編集 UI / PATCH**（→ **3b・必須**。§11.10） |
| 照会成功 → 所持登録 | 連続リストからの一括登録（単件ボタンのみ） |
| 所持一覧・削除 | 未ヒットの手動マスタ登録 |
| 一覧で note/status は表示のみ可（多くは null） | プリセット切替・永続系モード（3d） |
| 仮 `userId` 定数（当時） | 認証（Phase 4・管理者まで完了） |
| | Yahoo 再照会を登録時に必須にしない |

#### 11.9.2 定数

```ts
// src/lib/items/constants.ts（現行）
export const DEFAULT_PRESET_KEY = "paint";
export const STATUS1_OPTIONS = ["満タン", "余裕あり", "半分", "残少", "要補充"] as const;
```

- クライアントに秘密は置かない。`userId` はサーバが Auth uid を付与（ボディで受け取らない）

#### 11.9.3 登録時のデータ流れ

```text
[Client] ProductLookupResult (found:true)
  → POST /api/items  { code, name, imageUrl?, brandName?, source }
  → [Server] zod 検証
  → Product upsert by jan（name 等は初回作成時に保存。既存行は jan 以外は当面更新しない）
  → UserItem create（userId=Auth uid, presetKey=DEFAULT, status/note/remaining=null）
  → 201 { item: UserItem & { product } }
  → 同一 user で同じ JAN が既登録なら 409 { error: "Duplicate JAN for this user", item? }
```

選定理由（短く）:

1. 照会結果をクライアントから送る → 登録がオフライン寄りでも動く／Yahoo 再ヒットを避ける
2. Product 既存時に name を上書きしない → 店舗タイトルの揺らぎで表示が勝手に変わらない
3. 重複は 409（登録済み JAN）。「所持しているか」は使い方の話で、API はデータの一意制約として返す

#### 11.9.4 API

Notes と同様: Route Handler + zod 境界 + `@/lib/prisma`。パスは所持ドメインを `items` とする。

| Method | Path | 役割 | 成功 |
|---|---|---|---|
| `GET` | `/api/items` | ログイン中 uid の所持一覧（新しい順、`product` include） | 200 `{ items }` |
| `POST` | `/api/items` | Product upsert + UserItem 作成 | 201 `{ item }` / 409 登録済み JAN 重複 |
| `DELETE` | `/api/items/[id]` | UserItem 削除（Product は残す） | 200 `{ ok: true }` / 404 |

**POST ボディ（zod 案）**

```ts
{
  code: string;      // lookup と同じ 8–14 桁正規化
  name: string;      // trim, 1..500
  brandName?: string;
  imageUrl?: string; // URL 文字列として緩く（https 推奨、厳密すぎない）
  source: "yahoo_shopping"; // 3a はこれのみ。manual は後続
}
```

**一覧 1 件の形（レスポンス）**

```ts
{
  id: string;
  userId: string;
  presetKey: string;
  remaining: string | null;
  note: string | null;
  status1: string | null;
  status2: string | null;
  status3: string | null;
  createdAt: string; // JSON 化後
  updatedAt: string;
  product: {
    id: string;
    jan: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
    source: string;
  };
}
```

- DELETE / PATCH は `UserItem.id` + ログイン中 uid 一致（なければ 404）
- Product を消さない理由: 再登録時にマスタを再利用できる

#### 11.9.5 UI

トップ（`page.tsx`）は Server Component のまま。

| 箇所 | 変更 |
|---|---|
| ヘッダ文言 | Notes 固定から、消耗品所持の学習アプリ寄りへ（過度なブランド作りはしない） |
| スキャン（単体） | 照会成功パネルに「所持に登録」ボタン |
| スキャン（連続） | リスト各行（`found:true`）に「登録」ボタン（1 件ずつ）。一括は後続 |
| 登録一覧 | Server で `userItem.findMany` |
| 削除 | 一覧行に確認付き削除 |

Client 側:

- `src/hooks/items/use-register-item.ts`（案）: POST / 結果 / pending / エラー
- 登録成功後は `router.refresh()` で Server 一覧を更新（Notes 作成と同パターン）

PC（`md` 以上）はスキャン非表示のまま。手動入力は既存のまま → 照会 → 登録、で PC 検証可能。

#### 11.9.6 ファイル配置（浅い分割に揃える）

```text
prisma/schema.prisma              # Product / UserItem 追加
prisma/migrations/...             # migrate（db push しない）

src/lib/items/
  constants.ts
  item-schemas.ts                 # zod
  （必要なら）types.ts

src/app/api/items/route.ts        # GET / POST
src/app/api/items/[id]/route.ts   # DELETE（3b で PATCH 追加）

src/components/items/             # 一覧・削除・登録ボタン周りの UI
src/hooks/items/                  # 登録 fetch など

src/components/scan/...           # 登録ボタンをパネル／リストへ結線（最小）
src/app/page.tsx                  # 所持一覧のサーバ取得
```

テスト: `item-schemas` のユニットテストを Notes / product-lookup に揃えて追加。

#### 11.9.7 実装順（提案）

1. schema + migrate + `prisma generate`
2. zod + `GET/POST/DELETE` API（curl / テストで確認）
3. 所持一覧 UI（空状態）
4. 単体スキャン「登録」結線
5. 連続リスト「登録」結線
6. lint / typecheck / test
7. → **続けて 3b（§11.10）**: 編集

#### 11.9.8 設計チェック（3a）

- [x] API パス・メソッド・ステータス（201 / 409 / 404）
- [x] POST はクライアント照会スナップショット。Product 既存時は name 非上書き
- [x] userId はサーバが Auth uid を付与。連続は単件登録のみ（当時は仮定数）
- [x] UI: 登録ボタン + 一覧・削除。編集は 3b（必須）
- [x] 本節承認。小項目ずつ実装（まず schema）

### 11.10 Phase 3b 編集設計（登録のあと・必須）

コメント（`note`）とステータスがあるため、**登録だけだと状態を変えられない**。3a 完了後に入れる。

#### スコープ

| 必須 | 任意（同 Step でも後でも可） |
|---|---|
| `PATCH /api/items/[id]` | `remaining` 編集 |
| UI: 一覧から `note` / `status1` を編集 | `status2` / `status3` の表示・編集 |
| 空文字 → null など Notes と同様の正規化 | 登録済み検索・絞り込み |
| | ステータス候補のプリセット UI（→ 3d。当面は自由入力で可） |

#### API（案）

```ts
// PATCH /api/items/[id]
{
  note?: string | null;
  status1?: string | null;
  // 任意で後から: status2?, status3?, remaining?
}
```

- 存在確認 + `userId ===` ログイン中 uid（なければ 404）
- 成功 200 `{ item }`（product include）
- `[id]/route.ts` に PATCH あり

#### UI（案）

- 所持一覧の各行で、Note の編集に近いインライン or 小さなフォーム
- 初期は `status1` をテキスト入力（プリセット選択は 3d）
- 保存後 `router.refresh()`

#### 設計チェック（3b）

- [x] 編集は 3a の後・必須（note + status1）
- [x] PATCH を `[id]` に追加。status2/3・remaining・検索は任意
- [x] `PATCH /api/items/[id]` + 一覧表の編集 UI を実装
- [x] 一覧強化（残量バー・検索・一括操作・スキャン UI 簡略化）まで完了（詳細は学習メモ §12）

---

## 12. Phase 4 — 管理者ログイン（完了）

公開サインアップはまだ。**管理者だけログインできる**状態まで実装済み（2026-10-08）。

### 方針（実装済み）

| 項目 | 内容 |
|---|---|
| Auth | Supabase Auth（メール／パスワード） |
| 登録 UI | **なし**（Dashboard でユーザー作成） |
| 制限 | `ADMIN_EMAIL` と一致するメールだけ利用可（未設定ならログイン済みなら誰でも可） |
| データ | `UserItem.userId` = Auth **uid** |
| 入口 | `/login`。未ログインは `src/proxy.ts` で誘導。ログアウトあり |

### 主なコード

```text
src/proxy.ts
src/lib/supabase/          # browser / server / proxy / env
src/lib/auth/require-user.ts
src/app/login/
src/app/logout/
src/components/auth/
```

### チェック

- [x] セッション更新 Proxy + 未ログイン → `/login`
- [x] ログイン／ログアウト UI
- [x] API / ページで `requireUser*`（uid で一覧・更新を絞る）
- [x] `ADMIN_EMAIL` 制限（§13 でゲート廃止予定。管理者概念は残す）
- [x] env 正規化（URL に `/rest/v1` を付けない）
- [x] 既存 `local-dev-user` … コード・データ削除済み（§13.5）

---

## 13. Phase 4.5 — 一般ユーザー登録（設計合意・2026-10-14）

実装前の合意。詳細な Auth の仕組み解説は実装時に学習メモへ書く。

### 13.1 方針

| 項目 | 決定 |
|---|---|
| データ所有 | **ユーザー単位**（`UserItem.userId` = Auth uid）。当面変更なし |
| 管理者 | 概念は残す（`ADMIN_EMAIL`）。**画面 UI は一般と同じ**。運用で直すときは Supabase 上で編集 |
| アプリ利用ゲート | **確認済みログインユーザーなら利用可**（いまの「管理者メールだけ」ゲートは外す） |
| 登録方式 | メール＋パスワード ＋ **確認メール**（Supabase Auth `signUp`） |
| ログイン | 既存 `/login` を継続（メール＋パスワード） |
| ユーザーID | **必須**。表示（「○○さん」）と DB／管理画面での照合用。**ログインには使わない** |
| 第1弾スコープ | 登録＋ログイン＋**パスワードリセット**。OAuth・username ログインは後回し |

### 13.2 用語

| 名前 | 中身 |
|---|---|
| Auth uid | Supabase 発行。所持・認可の正。人が選ばない |
| メール | ログイン・確認用（必須） |
| ユーザーID / username | **登録時必須**の短い一意 ID。null にしない（照合のため） |

### 13.3 データ（Profile）

```prisma
model Profile {
  id         String   @id @default(cuid())
  authUserId String   @unique  // Auth uid
  username   String   @unique  // 必須・一意（null 不可）
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

- 登録フォームではユーザーID必須。zod で文字種・長さ（例: 3〜20、`[a-zA-Z0-9_]`）
- 一意制約で DB 照合・取り違え防止。null 許容にしない（空行が増えると管理画面での意味が薄い）
- 確認完了後（または初回セッション）に Profile 作成。`signUp` 時は `user_metadata` に username を載せ、確定時に Profile へ書く想定
- 登録前に重複チェック（UX）。未確認ユーザーによる長時間の先取りは実装時に扱いを決める
- `UserItem.userId` は Auth uid のまま（username に差し替えない）
- Dashboard だけで作った既存管理者は、初回ログイン時に Profile 作成を促すか、手元で 1 行入れる（実装時）

### 13.4 画面・経路

```text
/login                 … 既存。新規登録・パスワード再設定へのリンク
/signup                … メール・パスワード・ユーザーID（すべて必須）（公開）
/forgot-password       … リセットメール依頼（公開・パス名は実装時に決定可）
/auth/callback 等      … 確認メール／リセットリンクの code 交換（公開）
（任意）確認待ちの案内文言・新パスワード入力画面
```

Proxy の公開パス: `/login` / `/signup` / リセット関連 / `/auth`  
認可: `proxy` / `require-user` は「ログイン済み」で通す（管理者メール一致はゲートに使わない）

表示: ヘッダー等は `{username} さん`（Profile 必須前提）

### 13.5 タスク順（実装）

細分化した工程表・進捗: **`docs/AUTH_SIGNUP_WORK_UNITS.md`**（U1〜U13）。  
学習メモへの追記は、学んだ内容を確認してから行う。

粗い対応（詳細は工程表）:

| # | 内容 |
|---|---|
| 1 | `Profile` schema + migrate + generate |
| 2〜3 | `/signup` UI + `signUp` + callback |
| 4〜5 | ゲート解除・表示名 |
| 6 | パスワードリセット |
| 7〜8 | 通し確認・学習メモ |
| 9 | `local-dev-user` 削除（完了） |

任意（本 Phase の外）: 一括 API、ページネーション、`status2`/`3`、カテゴリ探索、OAuth

### 13.6 設計チェック（合意）

- [x] A: ユーザー単位データ。管理者は残すが UI は同一。運用は Supabase 直編集可
- [x] B1: メール＋パスワード＋確認メール。仕組みは学習メモへ
- [x] C: 既存ログイン＋最小登録
- [x] username = **必須**・一意。表示＋DB 照合用（ログイン非使用）。null にしない
- [x] `local-dev-user` は一般利用可能後に削除してよい
- [x] 実装チェック（§13.5／工程表 U1〜U13）

---

## 14. 将来拡張 — 組織単位（方向性のみ）

いまは **個人インベントリ**が正。組織（家族・チーム）の共有在庫は未実装。

### 14.1 現状との相性

| 層 | 現状 | 組織化 |
|---|---|---|
| `Product`（JAN マスタ） | 全体共有 | **そのまま使える**見込み |
| `UserItem` | `userId` のみ | **不足**。所有者キーの追加が必要 |
| 認可 | uid 一致 | メンバーシップ判定が追加で必要 |

**結論:** 拡張は可能だが、所持の所有者モデルを足すマイグレーションが必要。「カラムを足せばゼロコスト」ではない。第1弾で org 用カラムを先入れする必要は薄い。

### 14.2 推奨する拡張の形（後続）

```text
Organization
Membership（authUserId, orgId, role …）
UserItem
  userId  … 登録者・担当（残す）
  orgId   … null = 個人、値あり = 組織の共有在庫
```

- 既存の個人行は `orgId = null` のまま移行できる
- 一覧は「自分の個人」または「所属 org」で絞る
- 管理者（`ADMIN_EMAIL`）と「組織の owner」は別概念になりやすい → 組織導入時に再定義

やらない方針（当面）: `ownerType` / `ownerId` への全面載せ替え、組織別 Product マスタ。

### 14.3 いま書いておく理由

登録・Profile を個人前提で進めてよいことの根拠にする。組織が必要になったら §14.2 から設計を起こす。
