import { describe, expect, it } from "vitest";
import { getStatus1MeterStyle, STATUS1_METER_STYLE } from "@/lib/items/status1-meter";

describe("getStatus1MeterStyle", () => {
  it("候補値ならスタイルを返す", () => {
    expect(getStatus1MeterStyle("満タン")).toEqual(STATUS1_METER_STYLE["満タン"]);
    expect(getStatus1MeterStyle("要補充")?.fillPercent).toBe(12);
  });

  it("null や未知値は null", () => {
    expect(getStatus1MeterStyle(null)).toBeNull();
    expect(getStatus1MeterStyle("不明")).toBeNull();
  });
});
