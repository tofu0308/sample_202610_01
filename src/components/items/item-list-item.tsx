"use client";

/**
 * 登録一覧の 1 件分（Client Component）。
 * いまは表示と削除のみ。コメント・ステータスの編集 UI は後で足す。
 */

import { useRouter } from "next/navigation";
import { useState } from "react";

export type ItemListItemData = {
  id: string;
  note: string | null;
  status1: string | null;
  product: {
    jan: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
  };
};

type ApiErrorResponse = { error: string; details?: unknown };

type ItemListItemProps = {
  item: ItemListItemData;
};

export function ItemListItem({ item }: ItemListItemProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleDelete() {
    if (!window.confirm(`「${item.product.name}」の登録を削除しますか？`)) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch(`/api/items/${item.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = (await response.json()) as ApiErrorResponse;
        setError(data.error || "削除に失敗しました");
        return;
      }

      router.refresh();
    } catch {
      setError("ネットワークエラーが発生しました");
    } finally {
      setPending(false);
    }
  }

  return (
    <li className="rounded-lg border border-zinc-200 px-4 py-3">
      <div className="flex items-start gap-3">
        {item.product.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
          <img
            src={item.product.imageUrl}
            alt=""
            width={56}
            height={56}
            className="h-14 w-14 shrink-0 rounded border border-zinc-200 object-cover"
          />
        ) : (
          <div
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 text-[10px] text-zinc-400"
            aria-hidden
          >
            画像なし
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-0.5">
          <p className="font-mono text-xs text-zinc-500">{item.product.jan}</p>
          <h3 className="font-medium text-zinc-900">{item.product.name}</h3>
          {item.product.brandName ? (
            <p className="text-sm text-zinc-500">{item.product.brandName}</p>
          ) : null}
          {item.status1 ? (
            <p className="text-sm text-zinc-600">ステータス: {item.status1}</p>
          ) : null}
          {item.note ? (
            <p className="whitespace-pre-wrap text-sm text-zinc-600">
              {item.note}
            </p>
          ) : null}
        </div>
        <button
          type="button"
          onClick={() => void handleDelete()}
          disabled={pending}
          className="shrink-0 rounded-md border border-red-200 px-2.5 py-1 text-sm text-red-700 disabled:opacity-50"
        >
          {pending ? "削除中…" : "削除"}
        </button>
      </div>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </li>
  );
}
