import { describe, expect, it } from "vitest";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app-name";

describe("app-name", () => {
  it("プロダクト名と説明が空でない", () => {
    expect(APP_NAME.length).toBeGreaterThan(0);
    expect(APP_DESCRIPTION.length).toBeGreaterThan(0);
  });
});
