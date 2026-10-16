"use client";

/**
 * 照会成功した商品を DB に登録するボタン。
 * 単体パネル・連続リストの両方から使う。
 * 件数上限到達時は disabled。
 */

import { itemPrimaryButtonClass } from "@/components/items/item-action-styles";
import { useRegisterItem } from "@/hooks/items/use-register-item";
import {
  isRegisterBlockedByLimit,
  registerLimitHint,
  type ItemLimitView,
} from "@/lib/items/item-limit-view";
import type { FoundProduct } from "@/lib/items/register-item-request";

type RegisterItemButtonProps = {
  product: FoundProduct;
  /** 連続リストなど、横並び用に小さくするとき */
  compact?: boolean;
  /** 登録成功後（一覧スクロール・読取クリアなど） */
  onRegistered?: () => void;
  /** 件数上限（未渡しも可＝制限 UI なし） */
  itemLimit?: ItemLimitView;
};

export function RegisterItemButton({
  product,
  compact = false,
  onRegistered,
  itemLimit,
}: RegisterItemButtonProps) {
  const { register, pending, error, successMessage } = useRegisterItem({
    onRegistered,
  });
  // compact はリスト行内向け（上マージンは付けない）
  const wrapperClassName = "space-y-1";
  const buttonClassName = compact
    ? itemPrimaryButtonClass.compact
    : itemPrimaryButtonClass.md;
  const limitBlocked = itemLimit ? isRegisterBlockedByLimit(itemLimit) : false;
  const limitHint = itemLimit ? registerLimitHint(itemLimit) : null;

  return (
    <div className={wrapperClassName}>
      <button
        type="button"
        onClick={() => void register(product)}
        disabled={pending || limitBlocked}
        className={buttonClassName}
      >
        {pending ? "処理中…" : "登録"}
      </button>
      {successMessage ? (
        <p className="text-xs text-emerald-700">{successMessage}</p>
      ) : null}
      {limitHint ? <p className="text-xs text-amber-700">{limitHint}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
