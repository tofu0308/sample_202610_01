/**
 * 単一 Note の更新・削除 API（Route Handler）。
 * パスの id とボディを検証してから Prisma に渡す。存在しない id は 404。
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

/** PATCH ボディ（title 必須、body は省略可。空文字は null にして本文クリア） */
const updateNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
});

type RouteParams = { params: Promise<{ id: string }> };

/** Note を 1 件更新する */
export async function PATCH(request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const json: unknown = await request.json();
    const parsed = updateNoteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    const note = await prisma.note.update({
      where: { id },
      data: {
        title: parsed.data.title,
        // body 未送信なら更新しない。空文字ならクリア（null）
        ...(parsed.data.body !== undefined
          ? { body: parsed.data.body === "" ? null : parsed.data.body }
          : {}),
      },
    });

    return NextResponse.json({ note });
  } catch (error) {
    console.error("PATCH /api/notes/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to update note" },
      { status: 500 },
    );
  }
}

/** Note を 1 件削除する */
export async function DELETE(_request: Request, context: RouteParams) {
  try {
    const { id } = await context.params;

    if (!id) {
      return NextResponse.json({ error: "Invalid note id" }, { status: 400 });
    }

    const existing = await prisma.note.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Note not found" }, { status: 404 });
    }

    await prisma.note.delete({ where: { id } });

    // 削除成功は本文なしで十分（学習用）
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("DELETE /api/notes/[id] failed", error);
    return NextResponse.json(
      { error: "Failed to delete note" },
      { status: 500 },
    );
  }
}
