/**
 * 照会スナップショットからの所持作成 UT。
 * 実装は本番どおり Prisma を使う。テスト側だけ vi.mock で差し替える。
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PRESET_KEY } from "@/lib/items/constants";

const { upsert, findUnique, create } = vi.hoisted(() => ({
  upsert: vi.fn(),
  findUnique: vi.fn(),
  create: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    product: { upsert },
    userItem: { findUnique, create },
  },
}));

import { createUserItemFromSnapshot } from "@/lib/items/create-user-item-from-snapshot";

const snapshot = {
  code: "4901234567890",
  name: "テスト塗料",
  source: "yahoo_shopping" as const,
  brandName: "Brand",
  imageUrl: "https://example.com/a.jpg",
};

beforeEach(() => {
  upsert.mockReset();
  findUnique.mockReset();
  create.mockReset();
  upsert.mockResolvedValue({ id: "product-1" });
});

describe("createUserItemFromSnapshot", () => {
  it("未所持なら upsert のあと create する", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "item-new",
      product: { jan: snapshot.code, name: snapshot.name },
    });

    const result = await createUserItemFromSnapshot("user-1", snapshot);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.item.id).toBe("item-new");
    }
    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { jan: snapshot.code },
        create: expect.objectContaining({
          jan: snapshot.code,
          name: snapshot.name,
          brandName: "Brand",
        }),
      }),
    );
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          userId: "user-1",
          productId: "product-1",
          presetKey: DEFAULT_PRESET_KEY,
        },
      }),
    );
  });

  it("すでに所持なら duplicate で create しない", async () => {
    const existing = {
      id: "item-old",
      product: { jan: snapshot.code, name: snapshot.name },
    };
    findUnique.mockResolvedValue(existing);

    const result = await createUserItemFromSnapshot("user-1", snapshot);

    expect(result).toEqual({ ok: false, kind: "duplicate", item: existing });
    expect(create).not.toHaveBeenCalled();
  });

  it("省略フィールドは null で upsert する", async () => {
    findUnique.mockResolvedValue(null);
    create.mockResolvedValue({
      id: "item-new",
      product: { jan: "4901234567890", name: "名前のみ" },
    });

    await createUserItemFromSnapshot("user-1", {
      code: "4901234567890",
      name: "名前のみ",
      source: "yahoo_shopping",
    });

    expect(upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({
          brandName: null,
          imageUrl: null,
        }),
      }),
    );
  });
});
