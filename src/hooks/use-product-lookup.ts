/**
 * POST /api/products/lookup を叩いて商品情報を state に載せる。
 * ヒット時の副作用（オーバーレイ閉鎖など）は呼び出し側に任せる。
 */

import { useCallback, useState } from "react";
import type { ProductLookupResult } from "@/lib/scan/types";

type LookupJson = ProductLookupResult | { error: string };

/** fetch 本体。state を更新しない版は連続スキャンのキュー用 */
async function fetchProductLookup(
  code: string,
): Promise<{ data: ProductLookupResult | null; error: string | null }> {
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

export function useProductLookup() {
  const [product, setProduct] = useState<ProductLookupResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (code: string) => {
    setPending(true);
    setError(null);
    setProduct(null);

    const { data, error: message } = await fetchProductLookup(code);
    if (message) {
      setError(message);
      setPending(false);
      return null;
    }

    setProduct(data);
    setPending(false);
    return data;
  }, []);

  const lookupOnce = useCallback(async (code: string) => {
    return fetchProductLookup(code);
  }, []);

  const reset = useCallback(() => {
    setProduct(null);
    setError(null);
    setPending(false);
  }, []);

  return { product, pending, error, lookup, lookupOnce, reset };
}
