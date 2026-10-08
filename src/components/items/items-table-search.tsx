"use client";

/**
 * 登録一覧のフリーワード検索。
 * 商品名は常に対象。メモ・JAN はチェックで追加する。
 */

type ItemsTableSearchProps = {
  query: string;
  includeNote: boolean;
  includeJan: boolean;
  matchCount: number;
  totalCount: number;
  onQueryChange: (value: string) => void;
  onIncludeNoteChange: (value: boolean) => void;
  onIncludeJanChange: (value: boolean) => void;
};

export function ItemsTableSearch({
  query,
  includeNote,
  includeJan,
  matchCount,
  totalCount,
  onQueryChange,
  onIncludeNoteChange,
  onIncludeJanChange,
}: ItemsTableSearchProps) {
  const filtering = query.trim() !== "";

  // 表ラッパと同じ -mx-1 にして横幅を揃える
  return (
    <div className="-mx-1 space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-zinc-600">
          <span className="font-medium text-zinc-800">フリーワード検索</span>
          <input
            type="search"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            placeholder="キーワードを入力（商品名）"
            className="w-full rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-500"
          />
        </label>
        {filtering ? (
          <p className="shrink-0 text-xs text-zinc-500 sm:pt-5">
            {matchCount} / {totalCount} 件
          </p>
        ) : null}
      </div>

      <fieldset className="space-y-1">
        <legend className="text-xs font-medium text-zinc-800">
          検索対象に含める（商品名は常に対象）
        </legend>
        <div className="flex flex-wrap gap-x-4 gap-y-1">
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={includeNote}
              onChange={(event) => onIncludeNoteChange(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300"
            />
            メモ
          </label>
          <label className="inline-flex items-center gap-1.5 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={includeJan}
              onChange={(event) => onIncludeJanChange(event.target.checked)}
              className="h-3.5 w-3.5 rounded border-zinc-300"
            />
            JAN
          </label>
        </div>
      </fieldset>
    </div>
  );
}
