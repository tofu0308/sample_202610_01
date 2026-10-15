/**
 * 照会スナップショットから Product upsert → UserItem 作成。
 * 単件 POST と一括 POST で同じ手順にするため切り出す。
 */

import type { z } from "zod";
import { DEFAULT_PRESET_KEY } from "@/lib/items/constants";
import { createItemSchema } from "@/lib/items/item-schemas";
import { prisma } from "@/lib/prisma";

export type CreateItemSnapshot = z.infer<typeof createItemSchema>;

export type CreateUserItemFromSnapshotResult =
  | {
      ok: true;
      item: {
        id: string;
        product: { jan: string; name: string };
      };
    }
  | {
      ok: false;
      kind: "duplicate";
      item: {
        id: string;
        product: { jan: string; name: string };
      };
    };

/** 自分の所持に 1 件追加。重複 JAN は duplicate（既存行を返す） */
export async function createUserItemFromSnapshot(
  userId: string,
  data: CreateItemSnapshot,
): Promise<CreateUserItemFromSnapshotResult> {
  const { code, name, brandName, imageUrl, source } = data;

  const productFields = {
    name,
    brandName: brandName ?? null,
    imageUrl: imageUrl ?? null,
    source,
  };
  const product = await prisma.product.upsert({
    where: { jan: code },
    create: {
      jan: code,
      ...productFields,
    },
    update: productFields,
  });

  const existing = await prisma.userItem.findUnique({
    where: {
      userId_productId: {
        userId,
        productId: product.id,
      },
    },
    include: { product: true },
  });

  if (existing) {
    return { ok: false, kind: "duplicate", item: existing };
  }

  const item = await prisma.userItem.create({
    data: {
      userId,
      productId: product.id,
      presetKey: DEFAULT_PRESET_KEY,
    },
    include: { product: true },
  });

  return { ok: true, item };
}
