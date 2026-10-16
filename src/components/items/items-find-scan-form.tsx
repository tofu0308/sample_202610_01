"use client";

/**
 * 登録一覧のスキャン検索（手動 JAN）。
 * カメラ入口は登録用スキャン領域に任せ、ここでは PC でも使える手動入力に寄せる。
 */

import type { FormEvent } from "react";
import { itemsTableSearchInputClassName } from "@/components/items/items-table-styles";
import { primaryOnLightButtonClass } from "@/components/ui/button-styles";

type ItemsFindScanFormProps = {
  value: string;
  pending: boolean;
  message: string | null;
  messageTone: "error" | "info";
  onChange: (value: string) => void;
  onSubmit: (raw: string) => void;
};

export function ItemsFindScanForm({
  value,
  pending,
  message,
  messageTone,
  onChange,
  onSubmit,
}: ItemsFindScanFormProps) {
  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSubmit(value);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <p className="text-xs text-zinc-600">
        登録済みなら一覧で強調します。未登録なら照会のうえ、確認後に登録できます。
      </p>
      <label className="flex min-w-0 flex-col gap-1 text-xs text-zinc-600">
        <span className="font-medium text-zinc-800">JANコード</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="JANコードを入力"
          disabled={pending}
          className={itemsTableSearchInputClassName}
          autoComplete="off"
        />
      </label>
      <button
        type="submit"
        disabled={pending || value.trim() === ""}
        className={primaryOnLightButtonClass.md}
      >
        {pending ? "処理中…" : "探す"}
      </button>
      {message ? (
        <p
          role={messageTone === "error" ? "alert" : "status"}
          className={
            messageTone === "error"
              ? "text-xs text-red-600"
              : "text-xs text-zinc-600"
          }
        >
          {message}
        </p>
      ) : null}
    </form>
  );
}
