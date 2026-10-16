/** @vitest-environment jsdom */
/**
 * 検索フラグ・ソート切替の分岐を renderHook で確認する。
 * filter / sort 本体の網羅は lib の UT 側。
 */

import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { itemsTableRow } from "@/hooks/__tests__/items-table-row-fixture";
import { useItemsTableQuery } from "@/hooks/items/use-items-table-query";

const rows = [
  itemsTableRow({
    id: "1",
    name: "アクリル 赤",
    note: "棚A",
    jan: "4901111111111",
    status1: "残少",
  }),
  itemsTableRow({
    id: "2",
    name: "エナメル 青",
    note: "予備の赤",
    jan: "4902222222222",
    status1: "満タン",
  }),
  itemsTableRow({
    id: "3",
    name: "クリアー",
    note: null,
    jan: "4903333333333",
    status1: null,
  }),
];

describe("useItemsTableQuery", () => {
  it("既定は status1 昇順で、未設定は後ろ", () => {
    const { result } = renderHook(() => useItemsTableQuery(rows));

    expect(result.current.sortKey).toBe("status1");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["2", "1", "3"]);
    expect(result.current.totalCount).toBe(3);
    expect(result.current.matchCount).toBe(3);
  });

  it("同じキーの handleSort で昇降をトグルする", () => {
    const { result } = renderHook(() => useItemsTableQuery(rows));

    act(() => {
      result.current.handleSort("status1");
    });
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);

    act(() => {
      result.current.handleSort("status1");
    });
    expect(result.current.sortDir).toBe("asc");
  });

  it("別キーへ切り替えると昇順から始める", () => {
    const { result } = renderHook(() => useItemsTableQuery(rows));

    act(() => {
      result.current.handleSort("status1");
    });
    expect(result.current.sortDir).toBe("desc");

    act(() => {
      result.current.handleSort("name");
    });
    expect(result.current.sortKey).toBe("name");
    expect(result.current.sortDir).toBe("asc");
    expect(result.current.sorted.map((r) => r.id)).toEqual(["1", "2", "3"]);
  });

  it("検索は名前のみが既定。note / jan フラグで対象が増える", () => {
    const { result } = renderHook(() => useItemsTableQuery(rows));

    act(() => {
      result.current.setSearchQuery("赤");
    });
    expect(result.current.matchCount).toBe(1);
    expect(result.current.sorted.map((r) => r.id)).toEqual(["1"]);

    act(() => {
      result.current.setSearchIncludeNote(true);
    });
    expect(result.current.matchCount).toBe(2);
    expect(result.current.sorted.map((r) => r.id).sort()).toEqual(["1", "2"]);

    act(() => {
      result.current.setSearchQuery("490333");
      result.current.setSearchIncludeNote(false);
      result.current.setSearchIncludeJan(true);
    });
    expect(result.current.matchCount).toBe(1);
    expect(result.current.sorted.map((r) => r.id)).toEqual(["3"]);
  });
});
