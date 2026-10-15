/**
 * 一覧の検索・並べ替えだけを扱う。
 * 編集や一括操作の state と混ぜない（表示用の派生データに専念）。
 */

import { useMemo, useState } from "react";
import { filterItemsTableRows } from "@/lib/items/filter-items-table";
import {
  sortItemsTableRows,
  type ItemsTableRow,
  type ItemsTableSortDir,
  type ItemsTableSortKey,
} from "@/lib/items/items-table-sort";

export function useItemsTableQuery(items: ItemsTableRow[]) {
  // 消耗品管理では残量でまとめて見ることが多いので既定ソートにする
  const [sortKey, setSortKey] = useState<ItemsTableSortKey>("status1");
  const [sortDir, setSortDir] = useState<ItemsTableSortDir>("asc");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchIncludeNote, setSearchIncludeNote] = useState(false);
  const [searchIncludeJan, setSearchIncludeJan] = useState(false);

  const filtered = useMemo(
    () =>
      filterItemsTableRows(items, searchQuery, {
        includeNote: searchIncludeNote,
        includeJan: searchIncludeJan,
      }),
    [items, searchQuery, searchIncludeNote, searchIncludeJan],
  );

  const sorted = useMemo(
    () => sortItemsTableRows(filtered, sortKey, sortDir),
    [filtered, sortKey, sortDir],
  );

  function handleSort(key: ItemsTableSortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDir("asc");
  }

  return {
    sorted,
    totalCount: items.length,
    matchCount: filtered.length,
    searchQuery,
    setSearchQuery,
    searchIncludeNote,
    setSearchIncludeNote,
    searchIncludeJan,
    setSearchIncludeJan,
    sortKey,
    sortDir,
    handleSort,
  };
}
