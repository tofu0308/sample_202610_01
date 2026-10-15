/**
 * POST /api/products/lookup を叩いて商品情報を state に載せる。
 * fetch 本体は lib。ヒット時の副作用（オーバーレイ閉鎖など）は呼び出し側に任せる。
 */

import { useCallback, useState } from "react";
import { fetchProductLookup } from "@/lib/products/product-lookup-request";
import type { ProductLookupResult } from "@/lib/scan/types";

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

  /** state を更新しない版（連続スキャンのキュー用） */
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
