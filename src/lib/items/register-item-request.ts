/**
 * 登録 API へのリクエスト。
 * 単件は POST /api/items、まとめて登録は POST /api/items/bulk。
 */

import type { BulkCreateResult } from "@/lib/items/item-bulk-request";
import type { ProductLookupResult } from "@/lib/scan/types";

export type FoundProduct = Extract<ProductLookupResult, { found: true }>;

export type RegisterItemResult =
  | { ok: true }
  | { ok: false; kind: "duplicate" | "error" | "network"; message: string };

type RegisterItemJson =
  | { item: unknown }
  | { error: string; item?: unknown; details?: unknown };

function toRegisterBody(product: FoundProduct) {
  const body: {
    code: string;
    name: string;
    source: "yahoo_shopping";
    brandName?: string;
    imageUrl?: string;
  } = {
    code: product.code,
    name: product.name,
    source: product.source,
  };
  if (product.brandName) {
    body.brandName = product.brandName;
  }
  if (product.imageUrl) {
    body.imageUrl = product.imageUrl;
  }
  return body;
}

/** 照会成功 1 件を登録する。UI メッセージ用に結果を返す */
export async function postRegisterItem(
  product: FoundProduct,
): Promise<RegisterItemResult> {
  try {
    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(toRegisterBody(product)),
    });

    const data = (await response.json()) as RegisterItemJson;

    if (response.status === 409) {
      return {
        ok: false,
        kind: "duplicate",
        message: "すでに登録済みのJANコードです",
      };
    }

    if (!response.ok) {
      return {
        ok: false,
        kind: "error",
        message:
          "error" in data && data.error
            ? data.error
            : "登録に失敗しました",
      };
    }

    return { ok: true };
  } catch {
    return {
      ok: false,
      kind: "network",
      message: "ネットワークエラーが発生しました",
    };
  }
}

/** 照会成功した複数件を 1 リクエストで登録する */
export async function postRegisterItemsBulk(
  products: FoundProduct[],
): Promise<BulkCreateResult> {
  try {
    const response = await fetch("/api/items/bulk", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        items: products.map(toRegisterBody),
      }),
    });

    if (!response.ok) {
      let message = "一括登録に失敗しました";
      try {
        const data = (await response.json()) as { error?: string };
        if (data.error) {
          message = data.error;
        }
      } catch {
        // keep fallback
      }
      return { ok: false, message };
    }

    const data = (await response.json()) as {
      created: number;
      duplicates: number;
      failed: number;
      requested: number;
    };

    return {
      ok: true,
      created: data.created,
      duplicates: data.duplicates,
      failed: data.failed,
      requested: data.requested,
    };
  } catch {
    return { ok: false, message: "ネットワークエラーが発生しました" };
  }
}
