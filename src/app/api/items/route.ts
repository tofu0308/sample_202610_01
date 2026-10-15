/**
 * 登録の一覧取得・作成 API（Route Handler）。
 * 入力は zod で検証し、DB は @/lib/prisma。userId はログイン中の Auth uid。
 */

import { NextResponse } from "next/server";
import { requireUserForApi } from "@/lib/auth/require-user";
import { createUserItemFromSnapshot } from "@/lib/items/create-user-item-from-snapshot";
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
 * 同じ JAN のマスタがあれば表示用フィールドを更新する。
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

    const result = await createUserItemFromSnapshot(auth.user.id, parsed.data);

    if (!result.ok) {
      return NextResponse.json(
        { error: "Duplicate JAN for this user", item: result.item },
        { status: 409 },
      );
    }

    return NextResponse.json({ item: result.item }, { status: 201 });
  } catch (error) {
    console.error("POST /api/items failed", error);
    return NextResponse.json(
      { error: "Failed to create item" },
      { status: 500 },
    );
  }
}
