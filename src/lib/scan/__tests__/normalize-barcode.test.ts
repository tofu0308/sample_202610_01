import { describe, expect, it } from "vitest";
import { normalizeBarcodeDigits } from "@/lib/scan/normalize-barcode";

describe("normalizeBarcodeDigits", () => {
  it("ハイフン付き JAN を数字のみにする", () => {
    expect(normalizeBarcodeDigits("4950344-068920")).toBe("4950344068920");
  });

  it("桁数が足りない場合は null", () => {
    expect(normalizeBarcodeDigits("1234567")).toBeNull();
  });

  it("待ちリスト排他と同じ正規化キーになる", () => {
    const a = normalizeBarcodeDigits("4950344068920");
    const b = normalizeBarcodeDigits("495-0344-068920");
    expect(a).toBe(b);
  });
});
