/**
 * 連続読取の待ちリスト（スクロール可・商品画像付き）。
 */

import type { ContinuousScanEntry } from "@/lib/scan/types";

type ContinuousScanListProps = {
  sectionId: string;
  entries: ContinuousScanEntry[];
};

export function ContinuousScanList({
  sectionId,
  entries,
}: ContinuousScanListProps) {
  if (entries.length === 0) {
    return null;
  }

  return (
    <section
      id={sectionId}
      className="space-y-2 rounded-md border border-emerald-200 bg-emerald-50/50 px-4 py-3"
      aria-live="polite"
      aria-labelledby="continuous-list-heading"
    >
      <h3
        id="continuous-list-heading"
        className="text-sm font-medium text-zinc-800"
      >
        連続読取リスト（{entries.length} 件・JAN 重複なし）
      </h3>
      <ul className="max-h-80 space-y-2 overflow-y-auto text-sm">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="rounded border border-zinc-200 bg-white px-3 py-2"
          >
            {entry.product?.found === true ? (
              <div className="flex gap-3">
                {entry.product.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
                  <img
                    src={entry.product.imageUrl}
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
                <div className="min-w-0 space-y-0.5">
                  <p className="font-mono text-xs text-zinc-500">{entry.code}</p>
                  <p className="font-medium text-zinc-800">
                    {entry.product.name}
                  </p>
                  {entry.product.brandName ? (
                    <p className="text-xs text-zinc-500">
                      {entry.product.brandName}
                    </p>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="space-y-0.5">
                <p className="font-mono text-xs text-zinc-600">{entry.code}</p>
                {entry.lookupStatus === "loading" ||
                entry.lookupStatus === "pending" ? (
                  <p className="text-zinc-500">商品検索中…</p>
                ) : null}
                {entry.lookupError ? (
                  <p className="text-red-600">{entry.lookupError}</p>
                ) : null}
                {entry.product?.found === false ? (
                  <p className="text-zinc-500">商品情報なし</p>
                ) : null}
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
