/**
 * 商品照会 API（POST /api/products/lookup）へのリクエスト。
 * hook は state 更新だけにし、fetch の形はここに置く（登録・更新 request と同じ考え方）。
 */

import type { ProductLookupResult } from "@/lib/scan/types";

export type ProductLookupRequestResult = {
  data: ProductLookupResult | null;
  error: string | null;
};

type LookupJson = ProductLookupResult | { error: string };

/** 1 コードを照会する。UI メッセージ用に data / error を返す */
export async function fetchProductLookup(
  code: string,
): Promise<ProductLookupRequestResult> {
  try {
    const response = await fetch("/api/products/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ code }),
    });
    const data = (await response.json()) as LookupJson;

    if (!response.ok || "error" in data) {
      const message =
        "error" in data ? data.error : "商品情報の取得に失敗しました";
      return { data: null, error: message };
    }

    return { data, error: null };
  } catch {
    return {
      data: null,
      error: "商品情報の取得中にネットワークエラーが発生しました",
    };
  }
}
