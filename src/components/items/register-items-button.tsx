"use client";

/**
 * 照会成功した複数商品をまとめて登録するボタン（連続リスト用）。
 * TODO: 裏では単件 POST を順呼び。一括リクエスト API に切り替えたらここは維持して hook 側だけ差し替えでよい。
 */

import { useRegisterItems } from "@/hooks/items/use-register-item";
import type { FoundProduct } from "@/lib/items/register-item-request";

type RegisterItemsButtonProps = {
  products: FoundProduct[];
};

export function RegisterItemsButton({ products }: RegisterItemsButtonProps) {
  const { registerMany, pending, error, successMessage } = useRegisterItems();
  const count = products.length;
  const disabled = pending || count === 0;

  return (
    <div className="space-y-1">
      <button
        type="button"
        onClick={() => void registerMany(products)}
        disabled={disabled}
        className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending
          ? "登録中…"
          : count === 0
            ? "まとめて登録"
            : `まとめて登録（${count} 件）`}
      </button>
      {successMessage ? (
        <p className="text-xs text-emerald-700">{successMessage}</p>
      ) : null}
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
