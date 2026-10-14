/**
 * 商品照会結果を Product マスタへ反映する（設計書 §16）。
 * found のときだけ upsert（表示用フィールドを更新）。見つからないときは触らない。
 * Prisma は引数で受け取る → Yahoo／DB なしで UT できる。
 */

import type { ProductLookupResult } from "@/lib/scan/types";

export type FoundLookupProduct = Extract<ProductLookupResult, { found: true }>;

export type ProductUpsertArgs = {
  where: { jan: string };
  create: {
    jan: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
    source: string;
  };
  update: {
    name: string;
    brandName: string | null;
    imageUrl: string | null;
    source: string;
  };
};

export type ProductUpsertFn = (args: ProductUpsertArgs) => Promise<unknown>;

/** Prisma upsert に渡す引数（テストで形を固定するため切り出す） */
export function toProductUpsertArgs(found: FoundLookupProduct): ProductUpsertArgs {
  const data = {
    name: found.name,
    brandName: found.brandName ?? null,
    imageUrl: found.imageUrl ?? null,
    source: found.source,
  };

  return {
    where: { jan: found.code },
    create: {
      jan: found.code,
      ...data,
    },
    // 再照会成功時は名前・画像などを更新（所持 UserItem は触らない）
    update: data,
  };
}

/**
 * 照会結果に応じてマスタを同期する。
 * @param upsert 必須（Route では prisma.product.upsert を渡す）
 */
export async function syncProductFromLookupResult(
  result: ProductLookupResult,
  upsert: ProductUpsertFn,
): Promise<"synced" | "skipped"> {
  if (!result.found) {
    return "skipped";
  }

  await upsert(toProductUpsertArgs(result));
  return "synced";
}
