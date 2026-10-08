/**
 * 登録 1 件の更新・削除 API（Route Handler）。
 * 商品マスタ（Product）は消さず残す。自分の行だけ操作可。
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/require-user";
import {
  toUserItemUpdateData,
  updateItemSchema,
} from "@/lib/items/item-schemas";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/** メモ・残量など、登録行の状態を更新する */
export async function PATCH(request: Request, context: RouteParams) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    const json: unknown = await request.json();
    const parsed = updateItemSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.userItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    const item = await prisma.userItem.update({
      where: { id },
      data: toUserItemUpdateData(parsed.data),
      include: { product: true },
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("PATCH /api/items/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

/** 登録行を 1 件削除する（商品マスタは消さない） */
export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    const existing = await prisma.userItem.findUnique({ where: { id } });
    if (!existing || existing.userId !== auth.user.id) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    await prisma.userItem.delete({ where: { id } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/items/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}
