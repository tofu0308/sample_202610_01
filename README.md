# sample_202610_01

Next.js（App Router）+ Prisma 7 + Supabase の学習用メモアプリ。

## ローカル

```bash
cp .env.example .env
# .env に DATABASE_URL / DIRECT_URL を設定

npm install
npx prisma migrate dev
npm run dev
```

## 品質チェック（ローカル）

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage   # coverage/ に HTML / json-summary
```

GitHub Actions（`.github/workflows/ci.yml`）でも同じ系統を自動実行する。  
デプロイは Vercel。Actions は CI（品質ゲート）用。

## Vercel デプロイ（概要）

1. [Vercel](https://vercel.com) で GitHub リポジトリを Import
2. Framework Preset: Next.js（自動検出でよい）
3. Environment Variables に以下を設定（Production / Preview とも）
   - `DATABASE_URL`
   - `DIRECT_URL`
4. Deploy
5. 初回またはスキーマ変更後、本番 DB へマイグレーション:
   ```bash
   npx prisma migrate deploy
   ```
   （ローカルから `DIRECT_URL` を本番向けにした一時実行、または Vercel の環境で実行）

学習の最初は **いまの Supabase プロジェクトを共用**してよい。  
本番とローカルでデータを分けたいときは、別の Free プロジェクトを作り、Vercel 側の変数だけ差し替える。
