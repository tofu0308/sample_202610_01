/**
 * スキャン／商品照会まわりの共有型。
 * UI・hooks・API レスポンスの形を揃えるために置く。
 */

/** 単体読取（1 件で止める）か、連続読取（カメラ維持・待ちリスト）か */
export type ScanMode = "single" | "continuous";

/** カメラまたは手動入力の読取結果（永続化しない） */
export type ScanResult = {
  rawValue: string;
  format?: string;
  scannedAt: string;
};

/** 連続スキャンの待ちリスト 1 行（JAN は正規化済み code で排他） */
export type ContinuousScanEntry = {
  id: string;
  code: string;
  rawValue: string;
  format?: string;
  scannedAt: string;
  lookupStatus: "pending" | "loading" | "done" | "error";
  product: ProductLookupResult | null;
  lookupError: string | null;
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
