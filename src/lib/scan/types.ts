/**
 * スキャン／商品照会まわりの共有型。
 * UI・hooks・API レスポンスの形を揃えるために置く。
 */

/** カメラまたは手動入力の読取結果（永続化しない） */
export type ScanResult = {
  rawValue: string;
  format?: string;
  scannedAt: string;
};

/**
 * POST /api/products/lookup のアプリ向け結果。
 * アフィリエイト URL は含めない。
 */
export type ProductLookupResult =
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
