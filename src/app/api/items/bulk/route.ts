/**
 * 登録の一括 API（Route Handler）。
 * クライアントからの N 往復を 1 回にまとめ、待ち時間を抑える。
 * - PATCH: 残量の一括更新
 * - DELETE: 一括削除（Product マスタは残す）
 * - POST: まとめて登録（連続スキャン）
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/require-user";
import { assertUserItemLimit } from "@/lib/items/assert-user-item-limit";
import { createUserItemFromSnapshot } from "@/lib/items/create-user-item-from-snapshot";
import {
  bulkCreateItemsSchema,
  bulkDeleteItemsSchema,
  bulkUpdateItemsSchema,
} from "@/lib/items/item-schemas";
import { prisma } from "@/lib/prisma";

/** 選択行へ同じ残量を一括適用 */
export async function PATCH(request: Request) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const json: unknown = await request.json();
    const parsed = bulkUpdateItemsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { ids, status1 } = parsed.data;
    // status1 は refine 済み。型上は optional なので明示
    if (status1 === undefined) {
      return NextResponse.json(
        { error: "status1 is required" },
        { status: 400 },
      );
    }

    const owned = await prisma.userItem.findMany({
      where: { userId: auth.user.id, id: { in: ids } },
      select: { id: true },
    });
    const ownedIds = owned.map((row) => row.id);

    if (ownedIds.length > 0) {
      await prisma.userItem.updateMany({
        where: { userId: auth.user.id, id: { in: ownedIds } },
        data: { status1 },
      });
    }

    return NextResponse.json({
      requested: ids.length,
      updated: ownedIds.length,
      skipped: ids.length - ownedIds.length,
    });
  } catch (error) {
    console.error("PATCH /api/items/bulk failed", error);
    return NextResponse.json(
      { error: "Failed to bulk update items" },
      { status: 500 },
    );
  }
}

/** 選択行を一括削除（自分の行だけ） */
export async function DELETE(request: Request) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const json: unknown = await request.json();
    const parsed = bulkDeleteItemsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { ids } = parsed.data;

    const owned = await prisma.userItem.findMany({
      where: { userId: auth.user.id, id: { in: ids } },
      select: { id: true },
    });
    const ownedIds = owned.map((row) => row.id);

    if (ownedIds.length > 0) {
      await prisma.userItem.deleteMany({
        where: { userId: auth.user.id, id: { in: ownedIds } },
      });
    }

    return NextResponse.json({
      requested: ids.length,
      deleted: ownedIds.length,
      skipped: ids.length - ownedIds.length,
    });
  } catch (error) {
    console.error("DELETE /api/items/bulk failed", error);
    return NextResponse.json(
      { error: "Failed to bulk delete items" },
      { status: 500 },
    );
  }
}

/**
 * 複数商品をまとめて登録。
 * 1 件ずつと同じ upsert／重複判定をサーバー内で回し、往復だけ減らす。
 * 新規増分が残り枠を超える場合は全体 403（部分登録しない）。
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const json: unknown = await request.json();
    const parsed = bulkCreateItemsSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const limitCheck = await assertUserItemLimit({
      userId: auth.user.id,
      email: auth.user.email,
      requestCodes: parsed.data.items.map((item) => item.code),
    });
    if (!limitCheck.ok) {
      return NextResponse.json({ error: limitCheck.message }, { status: 403 });
    }

    let created = 0;
    let duplicates = 0;
    let failed = 0;

    for (const item of parsed.data.items) {
      try {
        const result = await createUserItemFromSnapshot(auth.user.id, item);
        if (result.ok) {
          created += 1;
        } else {
          duplicates += 1;
        }
      } catch (error) {
        console.error("POST /api/items/bulk item failed", error);
        failed += 1;
      }
    }

    return NextResponse.json(
      {
        created,
        duplicates,
        failed,
        requested: parsed.data.items.length,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("POST /api/items/bulk failed", error);
    return NextResponse.json(
      { error: "Failed to bulk create items" },
      { status: 500 },
    );
  }
}
