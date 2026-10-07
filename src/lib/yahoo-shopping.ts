/**
 * Yahoo!ショッピング 商品検索（v3）のサーバ側ラッパ。
 * appid は環境変数のみ。アフィリエイト用パラメータは付けない。
 * https://developer.yahoo.co.jp/webapi/shopping/v3/itemsearch.html
 */

const YAHOO_ITEM_SEARCH_URL =
  "https://shopping.yahooapis.jp/ShoppingWebService/V3/itemSearch";

export type YahooProductLookupResult =
  | {
      found: true;
      code: string;
      name: string;
      imageUrl?: string;
      brandName?: string;
      source: "yahoo_shopping";
    }
  | {
      found: false;
      code: string;
      source: "yahoo_shopping";
    };

/** Yahoo 応答のうち使うフィールドだけ（全体は巨大なので緩く受ける） */
type YahooItemSearchResponse = {
  totalResultsAvailable?: number;
  hits?: Array<{
    name?: string;
    image?: { small?: string; medium?: string };
    brand?: { name?: string };
    janCode?: string;
  }>;
};

export class YahooShoppingConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YahooShoppingConfigError";
  }
}

export class YahooShoppingRequestError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "YahooShoppingRequestError";
    this.status = status;
  }
}

function getAppId(): string {
  const appId = process.env.YAHOO_APP_ID?.trim();
  if (!appId) {
    throw new YahooShoppingConfigError(
      "YAHOO_APP_ID is not set. Add Client ID to .env (server only).",
    );
  }
  return appId;
}

/**
 * JAN で商品を 1 件照会する。
 * ヒット複数時は先頭を返す（学習用の最小）。アフィ関連は扱わない。
 */
export async function lookupProductByJan(
  code: string,
): Promise<YahooProductLookupResult> {
  const appId = getAppId();
  const url = new URL(YAHOO_ITEM_SEARCH_URL);
  url.searchParams.set("appid", appId);
  url.searchParams.set("jan_code", code);
  // 名前特定が目的なので件数は最小
  url.searchParams.set("results", "1");

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    // 商品マスタは変わりうる。学習用に都度取得
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new YahooShoppingRequestError(
      response.status,
      `Yahoo itemSearch failed (${response.status})${body ? `: ${body.slice(0, 200)}` : ""}`,
    );
  }

  const data = (await response.json()) as YahooItemSearchResponse;
  const available = data.totalResultsAvailable ?? 0;
  const hit = data.hits?.[0];

  if (available < 1 || !hit?.name) {
    return { found: false, code, source: "yahoo_shopping" };
  }

  const imageUrl = hit.image?.medium ?? hit.image?.small;
  const brandName = hit.brand?.name;

  return {
    found: true,
    code,
    name: hit.name,
    ...(imageUrl ? { imageUrl } : {}),
    ...(brandName ? { brandName } : {}),
    source: "yahoo_shopping",
  };
}
