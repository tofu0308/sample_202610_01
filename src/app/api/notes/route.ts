/**
 * Note の一覧取得・作成 API（Route Handler）。
 * 入力検証は zod（@/lib/notes）、DB 操作は @/lib/prisma。信頼できない入力をそのまま DB に渡さない。
 */

import { NextResponse } from "next/server";
import { createNoteSchema } from "@/lib/notes/note-schemas";
import { prisma } from "@/lib/prisma";

/** 新しい順で全件返す（学習用の最小 GET） */
export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notes });
  } catch (error) {
    // 詳細はサーバログのみ。クライアントには一般メッセージを返す
    console.error("GET /api/notes failed", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

/** Note を 1 件作成する */
export async function POST(request: Request) {
  try {
    // JSON は型が保証されないので unknown → safeParse
    const json: unknown = await request.json();
    const parsed = createNoteSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const note = await prisma.note.create({
      data: {
        title: parsed.data.title,
        body: parsed.data.body,
      },
    });

    return NextResponse.json({ note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes failed", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 },
    );
  }
}
