"use client";

/**
 * 読取 1 件分の行。照会結果（サムネ・商品名）と JANコードコピー・登録を出す。
 * 単体／連続で同じ見た目にして操作の齟齬を減らす。
 */

import { RegisterItemButton } from "@/components/items/register-item-button";
import { CopyJanButton } from "@/components/scan/copy-jan-button";
import { ProductThumbnail } from "@/components/ui/product-thumbnail";
import type { FoundProduct } from "@/lib/items/register-item-request";
import type { ProductLookupResult } from "@/lib/scan/types";

type ScanEntryRowProps = {
  code: string;
  lookupStatus?: "pending" | "loading" | "done" | "error";
  lookupError?: string | null;
  product?: ProductLookupResult | null;
  onRegistered?: () => void;
};

export function ScanEntryRow({
  code,
  lookupStatus,
  lookupError = null,
  product = null,
  onRegistered,
}: ScanEntryRowProps) {
  const foundProduct: FoundProduct | null =
    product?.found === true ? product : null;

  return (
    <li className="rounded border border-zinc-200 bg-white px-3 py-2 text-zinc-900">
      {foundProduct ? (
        <div className="mb-2 flex gap-3">
          <ProductThumbnail imageUrl={foundProduct.imageUrl} size={48} />
          <div className="min-w-0 flex-1">
            <p className="line-clamp-2 text-sm font-medium text-zinc-900">
              {foundProduct.name}
            </p>
            {foundProduct.brandName ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                {foundProduct.brandName}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <p className="font-mono text-sm text-zinc-800">{code}</p>
        <CopyJanButton jan={code} />
        {foundProduct ? (
          <div className="ml-auto">
            <RegisterItemButton
              product={foundProduct}
              compact
              onRegistered={onRegistered}
            />
          </div>
        ) : null}
      </div>
      {lookupStatus === "loading" || lookupStatus === "pending" ? (
        <p className="mt-1 text-xs text-zinc-500">照会中…</p>
      ) : null}
      {lookupError ? (
        <p className="mt-1 text-xs text-red-600">{lookupError}</p>
      ) : null}
      {product?.found === false ? (
        <p className="mt-1 text-xs text-zinc-500">
          商品マスタなし（登録には照会成功が必要です）
        </p>
      ) : null}
    </li>
  );
}
