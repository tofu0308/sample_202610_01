/**
 * 登録の一覧取得・作成 API（Route Handler）。
 * 入力は zod で検証し、DB は @/lib/prisma。userId はログイン中の Auth uid。
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/require-user";
import { DEFAULT_PRESET_KEY } from "@/lib/items/constants";
import { createItemSchema } from "@/lib/items/item-schemas";
import { prisma } from "@/lib/prisma";

/** ログイン中ユーザーの登録を、新しい順で返す（商品情報付き） */
export async function GET() {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const items = await prisma.userItem.findMany({
      where: { userId: auth.user.id },
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
 * 商品照会の結果を受け取り、商品マスタを用意したうえで登録行を作る。
 * すでに同じ JAN のマスタがある場合、名前などは上書きしない。
 * 同じユーザーで同じ JAN が登録済みなら 409。
 */
export async function POST(request: Request) {
  try {
    const auth = await requireUserForApi();
    if (!auth.ok) {
      return auth.response;
    }

    const json: unknown = await request.json();
    const parsed = createItemSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { code, name, brandName, imageUrl, source } = parsed.data;

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
          userId: auth.user.id,
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
        userId: auth.user.id,
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
