/**
 * 登録 API（POST /api/items）への 1 件リクエスト。
 * 単体ボタン・まとめて登録の両方から使い、fetch の形を一箇所に置く。
 * TODO: まとめて登録用の一括 API（複数件ボディ等）を足したら、単件用として残すか整理する。
 */

import type { ProductLookupResult } from "@/lib/scan/types";

export type FoundProduct = Extract<ProductLookupResult, { found: true }>;

export type RegisterItemResult =
  | { ok: true }
  | { ok: false; kind: "duplicate" | "error" | "network"; message: string };

type RegisterItemJson =
  | { item: unknown }
  | { error: string; item?: unknown; details?: unknown };

/** 照会成功 1 件を登録する。UI メッセージ用に結果を返す */
export async function postRegisterItem(
  product: FoundProduct,
): Promise<RegisterItemResult> {
  try {
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

    const response = await fetch("/api/items", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    const data = (await response.json()) as RegisterItemJson;

    if (response.status === 409) {
      return {
        ok: false,
        kind: "duplicate",
        message: "すでに登録済みの JAN です",
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
