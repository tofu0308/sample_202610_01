import { describe, expect, it } from "vitest";
import {
  formatDateTimeJst,
  formatDateTimeJstParts,
} from "@/lib/items/format-datetime-jst";

describe("formatDateTimeJst", () => {
  // 2026-01-15 15:04 UTC = 2026-01-16 00:04 JST
  const iso = "2026-01-15T15:04:00.000Z";

  it("日付と時刻を JST で分ける", () => {
    const parts = formatDateTimeJstParts(iso);
    expect(parts.date).toMatch(/2026/);
    expect(parts.date).toMatch(/01/);
    expect(parts.date).toMatch(/16/);
    expect(parts.time).toMatch(/00:04/);
  });

  it("1 行表示は日付と時刻を結合する", () => {
    const parts = formatDateTimeJstParts(iso);
    expect(formatDateTimeJst(iso)).toBe(`${parts.date} ${parts.time}`);
  });
});
