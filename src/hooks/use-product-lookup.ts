/**
 * POST /api/products/lookup を叩いて商品情報を state に載せる。
 * ヒット時の副作用（オーバーレイ閉鎖など）は呼び出し側に任せる。
 */

import { useCallback, useState } from "react";
import type { ProductLookupResult } from "@/lib/scan/types";

type LookupJson = ProductLookupResult | { error: string };

export function useProductLookup() {
  const [product, setProduct] = useState<ProductLookupResult | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lookup = useCallback(async (code: string) => {
    setPending(true);
    setError(null);
    setProduct(null);

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
        setError(message);
        return null;
      }

      setProduct(data);
      return data;
    } catch {
      setError("商品情報の取得中にネットワークエラーが発生しました");
      return null;
    } finally {
      setPending(false);
    }
  }, []);

  const reset = useCallback(() => {
    setProduct(null);
    setError(null);
    setPending(false);
  }, []);

  return { product, pending, error, lookup, reset };
}
