/**
 * item-schemas のユニットテスト。
 * 登録・更新ボディの境界検証を確認する。
 */

import { describe, expect, it } from "vitest";
import {
  createItemSchema,
  toUserItemUpdateData,
  updateItemSchema,
} from "@/lib/items/item-schemas";

const validBody = {
  code: "4905524535815",
  name: "テスト塗料",
  source: "yahoo_shopping" as const,
};

describe("createItemSchema", () => {
  it("必須項目があれば成功する", () => {
    const parsed = createItemSchema.safeParse(validBody);
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("4905524535815");
      expect(parsed.data.name).toBe("テスト塗料");
      expect(parsed.data.source).toBe("yahoo_shopping");
    }
  });

  it("JAN の非数字を除去する", () => {
    const parsed = createItemSchema.safeParse({
      ...validBody,
      code: "4905-5245-35815",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.code).toBe("4905524535815");
    }
  });

  it("短い JAN は拒否する", () => {
    const parsed = createItemSchema.safeParse({
      ...validBody,
      code: "12345",
    });
    expect(parsed.success).toBe(false);
  });

  it("空の name は拒否する", () => {
    const parsed = createItemSchema.safeParse({
      ...validBody,
      name: "   ",
    });
    expect(parsed.success).toBe(false);
  });

  it("source が yahoo_shopping 以外なら拒否する", () => {
    const parsed = createItemSchema.safeParse({
      ...validBody,
      source: "manual",
    });
    expect(parsed.success).toBe(false);
  });

  it("任意の brandName / imageUrl を受け取る", () => {
    const parsed = createItemSchema.safeParse({
      ...validBody,
      brandName: "テストブランド",
      imageUrl: "https://example.com/item.jpg",
    });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.brandName).toBe("テストブランド");
      expect(parsed.data.imageUrl).toBe("https://example.com/item.jpg");
    }
  });

  it("不正な imageUrl は拒否する", () => {
    const parsed = createItemSchema.safeParse({
      ...validBody,
      imageUrl: "not-a-url",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("updateItemSchema", () => {
  it("status1 だけでも成功する", () => {
    const parsed = updateItemSchema.safeParse({ status1: "残少" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status1).toBe("残少");
      expect(parsed.data.note).toBeUndefined();
    }
  });

  it("候補外の status1 は拒否する", () => {
    const parsed = updateItemSchema.safeParse({ status1: "所持中" });
    expect(parsed.success).toBe(false);
  });

  it("空文字の status1 は null にする（クリア）", () => {
    const parsed = updateItemSchema.safeParse({ status1: "" });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.status1).toBeNull();
    }
  });

  it("空文字の note は null にする（クリア）", () => {
    const parsed = updateItemSchema.safeParse({ note: "   " });
    expect(parsed.success).toBe(true);
    if (parsed.success) {
      expect(parsed.data.note).toBeNull();
    }
  });

  it("フィールドが無いと拒否する", () => {
    const parsed = updateItemSchema.safeParse({});
    expect(parsed.success).toBe(false);
  });
});

describe("toUserItemUpdateData", () => {
  it("送られたフィールドだけ返す", () => {
    const parsed = updateItemSchema.safeParse({
      status1: "要補充",
      note: "予備",
    });
    expect(parsed.success).toBe(true);
    if (!parsed.success) {
      return;
    }
    expect(toUserItemUpdateData(parsed.data)).toEqual({
      status1: "要補充",
      note: "予備",
    });
  });
});
