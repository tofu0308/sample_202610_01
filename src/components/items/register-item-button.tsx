"use client";

/**
 * 照会成功した商品を DB に登録するボタン。
 * 単体パネル・連続リストの両方から使う。
 */

import { itemPrimaryButtonClass } from "@/components/items/item-action-styles";
import { useRegisterItem } from "@/hooks/items/use-register-item";
import type { FoundProduct } from "@/lib/items/register-item-request";

type RegisterItemButtonProps = {
  product: FoundProduct;
  /** 連続リストなど、横並び用に小さくするとき */
  compact?: boolean;
};

export function RegisterItemButton({
  product,
  compact = false,
}: RegisterItemButtonProps) {
  const { register, pending, error, successMessage } = useRegisterItem();
  const wrapperClassName = compact ? "mt-2 space-y-1" : "space-y-1";
  const buttonClassName = compact
    ? itemPrimaryButtonClass.compact
    : itemPrimaryButtonClass.md;

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={() => void register(product)}
        disabled={pending}
        className={buttonClassName}
      >
        {pending ? "登録中…" : "登録"}
      </button>
      {successMessage ? (
        <p className="text-xs text-emerald-700">{successMessage}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
