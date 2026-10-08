"use client";

/**
 * 登録一覧テーブル（Client Component）。
 * 横スクロール可能な表形式。ヘッダクリックでソート（消耗品管理向けにステータスを既定）。
 * 編集 UI は後で足す。いまは表示と削除のみ。
 */

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export type ItemsTableRow = {
  id: string;
  note: string | null;
  status1: string | null;
  createdAt: string;
  product: {
    jan: string;
    name: string;
    brandName: string | null;
    imageUrl: string | null;
  };
};

type SortKey = "status1" | "name" | "jan" | "createdAt";
type SortDir = "asc" | "desc";

type ApiErrorResponse = { error: string; details?: unknown };

type ItemsTableProps = {
  items: ItemsTableRow[];
};

function compareNullableText(
  a: string | null,
  b: string | null,
  dir: SortDir,
): number {
  // 未設定は末尾へ（ステータス未入力をまとめて見やすくする）
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  const cmp = a.localeCompare(b, "ja");
  return dir === "asc" ? cmp : -cmp;
}

function sortRows(
  rows: ItemsTableRow[],
  key: SortKey,
  dir: SortDir,
): ItemsTableRow[] {
  const copy = [...rows];
  copy.sort((left, right) => {
    if (key === "status1") {
      return compareNullableText(left.status1, right.status1, dir);
    }
    if (key === "name") {
      return compareNullableText(left.product.name, right.product.name, dir);
    }
    if (key === "jan") {
      return compareNullableText(left.product.jan, right.product.jan, dir);
    }
    const cmp = left.createdAt.localeCompare(right.createdAt);
    return dir === "asc" ? cmp : -cmp;
  });
  return copy;
}

function SortHeader({
  label,
  column,
  activeKey,
  activeDir,
  onSort,
}: {
  label: string;
  column: SortKey;
  activeKey: SortKey;
  activeDir: SortDir;
  onSort: (key: SortKey) => void;
}) {
  const active = activeKey === column;
  const indicator = active ? (activeDir === "asc" ? " ▲" : " ▼") : "";

  return (
    <th
      scope="col"
      aria-sort={
        active ? (activeDir === "asc" ? "ascending" : "descending") : "none"
      }
      className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-600"
    >
      <button
        type="button"
        onClick={() => onSort(column)}
        className="inline-flex items-center rounded px-0.5 hover:text-zinc-900"
      >
        {label}
        <span className="text-zinc-400" aria-hidden>
          {indicator || " ↕"}
        </span>
      </button>
    </th>
  );
}

export function ItemsTable({ items }: ItemsTableProps) {
  const router = useRouter();
  // 消耗品管理ではステータスでまとめて見ることが多いので既定ソートにする
  const [sortKey, setSortKey] = useState<SortKey>("status1");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sorted = useMemo(
    () => sortRows(items, sortKey, sortDir),
    [items, sortKey, sortDir],
  );

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  async function handleDelete(item: ItemsTableRow) {
    if (!window.confirm(`「${item.product.name}」の登録を削除しますか？`)) {
      return;
    }

    setError(null);
    setPendingId(item.id);

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
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-zinc-500">
        表は横にスクロールできます。列見出しで並べ替え（既定はステータス）。
      </p>
      <div className="-mx-1 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-[52rem] w-full border-collapse text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50">
            <tr>
              <th
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-600"
              >
                画像
              </th>
              <SortHeader
                label="JAN"
                column="jan"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={handleSort}
              />
              <SortHeader
                label="商品名"
                column="name"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={handleSort}
              />
              <th
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-600"
              >
                ブランド
              </th>
              <SortHeader
                label="ステータス"
                column="status1"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={handleSort}
              />
              <th
                scope="col"
                className="min-w-[10rem] px-3 py-2 text-left text-xs font-medium text-zinc-600"
              >
                コメント
              </th>
              <SortHeader
                label="登録日"
                column="createdAt"
                activeKey={sortKey}
                activeDir={sortDir}
                onSort={handleSort}
              />
              <th
                scope="col"
                className="whitespace-nowrap px-3 py-2 text-left text-xs font-medium text-zinc-600"
              >
                操作
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((item) => {
              const pending = pendingId === item.id;
              const registeredAt = new Date(item.createdAt).toLocaleDateString(
                "ja-JP",
              );

              return (
                <tr
                  key={item.id}
                  className="border-b border-zinc-100 last:border-b-0"
                >
                  <td className="px-3 py-2">
                    {item.product.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
                      <img
                        src={item.product.imageUrl}
                        alt=""
                        width={40}
                        height={40}
                        className="h-10 w-10 rounded border border-zinc-200 object-cover"
                      />
                    ) : (
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 text-[9px] text-zinc-400"
                        aria-hidden
                      >
                        —
                      </div>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 font-mono text-xs text-zinc-600">
                    {item.product.jan}
                  </td>
                  <td className="max-w-[16rem] px-3 py-2 font-medium text-zinc-900">
                    <span className="line-clamp-2">{item.product.name}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-600">
                    {item.product.brandName ?? "—"}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-700">
                    {item.status1 ?? "—"}
                  </td>
                  <td className="max-w-[14rem] px-3 py-2 text-zinc-600">
                    <span className="line-clamp-2">{item.note ?? "—"}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-zinc-500">
                    {registeredAt}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2">
                    <button
                      type="button"
                      onClick={() => void handleDelete(item)}
                      disabled={pending}
                      className="rounded-md border border-red-200 px-2 py-1 text-xs text-red-700 disabled:opacity-50"
                    >
                      {pending ? "削除中…" : "削除"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
