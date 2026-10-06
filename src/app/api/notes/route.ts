import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const createNoteSchema = z.object({
  title: z.string().trim().min(1).max(200),
  body: z.string().trim().max(5000).optional(),
});

export async function GET() {
  try {
    const notes = await prisma.note.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ notes });
  } catch (error) {
    console.error("GET /api/notes failed", error);
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
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
