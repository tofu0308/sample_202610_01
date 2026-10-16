"use client";

/**
 * 照会成功した複数商品をまとめて登録するボタン（連続リスト用）。
 * 裏は POST /api/items/bulk（useRegisterItems）。
 * 新規増分が残り枠を超えると disabled。
 */

import { itemPrimaryButtonClass } from "@/components/items/item-action-styles";
import { useRegisterItems } from "@/hooks/items/use-register-item";
import {
  bulkRegisterLimitHint,
  isBulkRegisterBlockedByLimit,
  type ItemLimitView,
} from "@/lib/items/item-limit-view";
import type { FoundProduct } from "@/lib/items/register-item-request";

type RegisterItemsButtonProps = {
  products: FoundProduct[];
  /** 1件以上登録できたあと（一覧スクロール・読取クリアなど） */
  onRegistered?: () => void;
  itemLimit?: ItemLimitView;
};

export function RegisterItemsButton({
  products,
  onRegistered,
  itemLimit,
}: RegisterItemsButtonProps) {
  const { registerMany, pending, error, successMessage } = useRegisterItems({
    onRegistered,
  });
  const count = products.length;
  const codes = products.map((product) => product.code);
  const limitBlocked = itemLimit
    ? isBulkRegisterBlockedByLimit(itemLimit, codes)
    : false;
  const limitHint = itemLimit ? bulkRegisterLimitHint(itemLimit, codes) : null;
  const disabled = pending || count === 0 || limitBlocked;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void registerMany(products)}
        disabled={disabled}
        className={itemPrimaryButtonClass.md}
      >
        {pending
          ? "処理中…"
          : count === 0
            ? "まとめて登録"
            : `まとめて登録（${count} 件）`}
      </button>
      {successMessage ? (
        <p className="text-xs text-emerald-700">{successMessage}</p>
      ) : null}
      {limitHint ? <p className="text-xs text-amber-700">{limitHint}</p> : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
