/**
 * 登録（UserItem）の一覧取得・作成 API（Route Handler）。
 * 入力検証は zod（@/lib/items）、DB 操作は @/lib/prisma。仮 userId はサーバ定数のみ。
 */

import { NextResponse } from "next/server";
import {
  DEFAULT_PRESET_KEY,
  DEV_USER_ID,
} from "@/lib/items/constants";
import { createItemSchema } from "@/lib/items/item-schemas";
import { prisma } from "@/lib/prisma";

/** 仮 userId の登録一覧を新しい順で返す（product 付き） */
export async function GET() {
  try {
    const items = await prisma.userItem.findMany({
      where: { userId: DEV_USER_ID },
      orderBy: { createdAt: "desc" },
      include: { product: true },
    });
    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/items failed", error);
    return NextResponse.json(
      { error: "Failed to fetch items" },
      { status: 500 },
    );
  }
}

/**
 * 照会スナップショットから Product upsert + UserItem 作成。
 * 既存 Product の name 等は上書きしない。
 * 同一 userId+JAN（product）が既にあれば 409（データの一意制約。所持可否の判定ではない）。
 */
export async function POST(request: Request) {
  try {
    const json: unknown = await request.json();
    const parsed = createItemSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { code, name, brandName, imageUrl, source } = parsed.data;

    // 既存 JAN はマスタを再利用（店舗タイトルゆれで表示が変わらないように update は空）
    const product = await prisma.product.upsert({
      where: { jan: code },
      create: {
        jan: code,
        name,
        brandName: brandName ?? null,
        imageUrl: imageUrl ?? null,
        source,
      },
      update: {},
    });

    const existing = await prisma.userItem.findUnique({
      where: {
        userId_productId: {
          userId: DEV_USER_ID,
          productId: product.id,
        },
      },
      include: { product: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Duplicate JAN for this user", item: existing },
        { status: 409 },
      );
    }

    const item = await prisma.userItem.create({
      data: {
        userId: DEV_USER_ID,
        productId: product.id,
        presetKey: DEFAULT_PRESET_KEY,
      },
      include: { product: true },
    });

    return NextResponse.json({ item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/items failed", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 },
    );
  }
}
