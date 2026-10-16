import { describe, expect, it } from "vitest";
import { findRegisteredItemByJan } from "@/lib/items/find-registered-item";

describe("findRegisteredItemByJan", () => {
  const items = [
    { id: "1", jan: "4901111111111" },
    { id: "2", jan: "4902222222222" },
  ];

  it("一致すればその行、無ければ null", () => {
    expect(findRegisteredItemByJan(items, "4902222222222")).toEqual({
      id: "2",
      jan: "4902222222222",
    });
    expect(findRegisteredItemByJan(items, "4909999999999")).toBeNull();
  });
});
