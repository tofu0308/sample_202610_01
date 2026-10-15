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
  /** 登録成功後（一覧スクロール・読取クリアなど） */
  onRegistered?: () => void;
};

export function RegisterItemButton({
  product,
  compact = false,
  onRegistered,
}: RegisterItemButtonProps) {
  const { register, pending, error, successMessage } = useRegisterItem({
    onRegistered,
  });
  // compact はリスト行内向け（上マージンは付けない）
  const wrapperClassName = "space-y-1";
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
        {pending ? "処理中…" : "登録"}
      </button>
      {successMessage ? (
        <p className="text-xs text-emerald-700">{successMessage}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
