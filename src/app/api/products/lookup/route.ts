/**
 * JAN / バーコードから商品情報を照会する API（Route Handler）。
 * 入力は zod、外部呼び出しは Yahoo!ショッピング（サーバ側のみ）。アフィは使わない。
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/require-user";
import { productLookupSchema } from "@/lib/products/product-lookup-schemas";
import {
  lookupProductByJan,
  YahooShoppingConfigError,
  YahooShoppingRequestError,
} from "@/lib/products/yahoo-shopping";

/** 商品名などを返す（未ヒットも 200 + found:false）。ログイン必須 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const json: unknown = await request.json();
    const parsed = productLookupSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const result = await lookupProductByJan(parsed.data.code);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof YahooShoppingConfigError) {
      console.error("POST /api/products/lookup config", error.message);
      return NextResponse.json(
        { error: "Product lookup is not configured" },
        { status: 503 },
      );
    }
    if (error instanceof YahooShoppingRequestError) {
      console.error("POST /api/products/lookup yahoo", error.message);
      return NextResponse.json(
        { error: "Failed to look up product" },
        { status: 502 },
      );
    }
    console.error("POST /api/products/lookup failed", error);
    return NextResponse.json(
      { error: "Failed to look up product" },
      { status: 500 },
    );
  }
}
