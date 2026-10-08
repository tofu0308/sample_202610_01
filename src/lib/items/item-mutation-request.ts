/**
 * 登録 1 件の更新・削除リクエスト。
 * 表の編集／削除と将来の別 UI から同じ形で呼べるように、fetch を一箇所に置く。
 * TODO: 一括 PATCH / DELETE API ができたら、ここを束ねる呼び出しに差し替える。
 */

export type ItemMutationResult =
  | { ok: true }
  | { ok: false; message: string };

type ApiErrorJson = { error?: string; details?: unknown };

export type PatchItemBody = {
  status1?: string;
  note?: string;
};

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

/** note / status1 の片方だけでも可。空文字は API 側で null（クリア）になる */
export async function patchItem(
  id: string,
  body: PatchItemBody,
): Promise<ItemMutationResult> {
  const payload: PatchItemBody = {};
  if (body.status1 !== undefined) {
    payload.status1 = body.status1;
  }
  if (body.note !== undefined) {
    payload.note = body.note;
  }

  try {
    const response = await fetch(`/api/items/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
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
