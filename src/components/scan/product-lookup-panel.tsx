/**
 * 単体モードの商品照会結果。連続モードでは短い説明のみ。
 */

import type { ProductLookupResult, ScanResult } from "@/lib/scan/types";

type ProductLookupPanelProps = {
  sectionId: string;
  isContinuous: boolean;
  result: ScanResult | null;
  product: ProductLookupResult | null;
  lookupPending: boolean;
  lookupError: string | null;
};

export function ProductLookupPanel({
  sectionId,
  isContinuous,
  result,
  product,
  lookupPending,
  lookupError,
}: ProductLookupPanelProps) {
  if (isContinuous) {
    return (
      <p id={sectionId} className="text-sm text-zinc-500">
        連続モードでは読取ごとにリストへ追加し、商品照会は順番に実行します（同一
        JAN は 1 件のみ）。
      </p>
    );
  }

  return (
    <section
      id={sectionId}
      className="space-y-2 rounded-md border border-zinc-200 bg-white px-4 py-3"
      aria-live="polite"
      aria-labelledby="product-lookup-heading"
    >
      <h3
        id="product-lookup-heading"
        className="text-sm font-medium text-zinc-800"
      >
        商品情報
      </h3>
      {lookupPending ? (
        <p className="text-sm text-zinc-500">Yahoo!ショッピングで検索中…</p>
      ) : null}
      {lookupError ? (
        <p className="text-sm text-red-600">{lookupError}</p>
      ) : null}
      {!lookupPending && !lookupError && product?.found === true ? (
        <div className="flex gap-3 text-sm text-zinc-700">
          {product.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
            <img
              src={product.imageUrl}
              alt=""
              width={64}
              height={64}
              className="h-16 w-16 shrink-0 rounded border border-zinc-200 object-cover"
            />
          ) : null}
          <div className="min-w-0 space-y-1">
            <p className="font-medium">{product.name}</p>
            {product.brandName ? (
              <p className="text-zinc-500">ブランド: {product.brandName}</p>
            ) : null}
          </div>
        </div>
      ) : null}
      {!lookupPending && !lookupError && product?.found === false ? (
        <p className="text-sm text-zinc-500">
          商品情報が見つかりませんでした（Yahoo!ショッピング未出品の可能性）。
        </p>
      ) : null}
      {!result && !lookupPending ? (
        <p className="text-sm text-zinc-500">コードを読み取ると照会します。</p>
      ) : null}
      <p className="text-xs text-zinc-400">
        データ出典: Yahoo!ショッピング（アフィリエイトなし）
      </p>
    </section>
  );
}
