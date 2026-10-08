/**
 * 登録 1 件の更新・削除リクエスト。
 * 表の編集／削除と将来の別 UI から同じ形で呼べるように、fetch を一箇所に置く。
 */

export type ItemMutationResult =
  | { ok: true }
  | { ok: false; message: string };

type ApiErrorJson = { error?: string; details?: unknown };

async function readErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  try {
    const data = (await response.json()) as ApiErrorJson;
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

/** note / status1 を PATCH。空文字は API 側で null（クリア）になる */
export async function patchItem(
  id: string,
  body: { status1: string; note: string },
): Promise<ItemMutationResult> {
  try {
    const response = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response, "更新に失敗しました"),
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "ネットワークエラーが発生しました" };
  }
}

/** UserItem のみ削除（Product マスタは残す） */
export async function deleteItem(id: string): Promise<ItemMutationResult> {
  try {
    const response = await fetch(`/api/items/${id}`, {
      method: "DELETE",
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response, "削除に失敗しました"),
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, message: "ネットワークエラーが発生しました" };
  }
}
