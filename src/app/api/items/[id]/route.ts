/**
 * 単一 UserItem の削除 API（Route Handler）。
 * Product マスタは残す（再登録で再利用）。仮 userId 以外は 404 に寄せる。
 */

import { NextResponse } from "next/server";
import { DEV_USER_ID } from "@/lib/items/constants";
import { prisma } from "@/lib/prisma";

type RouteParams = { params: Promise<{ id: string }> };

/** UserItem を 1 件削除する（Product は削除しない） */
export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
    }

    const existing = await prisma.userItem.findUnique({ where: { id } });
    // TODO(auth): 認証導入後はセッション uid と照合する。いまは仮 userId 以外を 404 に寄せる
    if (!existing || existing.userId !== DEV_USER_ID) {
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
