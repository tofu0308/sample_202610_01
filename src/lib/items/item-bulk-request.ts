/**
 * 一括更新・削除・登録の Client 向け fetch。
 * 往復を 1 回にし、hooks 側の N 回ループをやめる。
 */

export type BulkMutationResult =
  | {
      ok: true;
      requested: number;
      affected: number;
      skipped: number;
    }
  | { ok: false; message: string };

export type BulkCreateResult =
  | {
      ok: true;
      created: number;
      duplicates: number;
      failed: number;
      requested: number;
    }
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

/** 選択行へ同じ残量を一括適用 */
export async function patchItemsBulk(
  ids: string[],
  status1: string,
): Promise<BulkMutationResult> {
  try {
    const response = await fetch("/api/items/bulk", {
      method: "PATCH",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ids, status1 }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response, "一括更新に失敗しました"),
      };
    }

    const data = (await response.json()) as {
      requested: number;
      updated: number;
      skipped: number;
    };

    return {
      ok: true,
      requested: data.requested,
      affected: data.updated,
      skipped: data.skipped,
    };
  } catch {
    return { ok: false, message: "ネットワークエラーが発生しました" };
  }
}

/** 選択行を一括削除 */
export async function deleteItemsBulk(
  ids: string[],
): Promise<BulkMutationResult> {
  try {
    const response = await fetch("/api/items/bulk", {
      method: "DELETE",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ ids }),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: await readErrorMessage(response, "一括削除に失敗しました"),
      };
    }

    const data = (await response.json()) as {
      requested: number;
      deleted: number;
      skipped: number;
    };

    return {
      ok: true,
      requested: data.requested,
      affected: data.deleted,
      skipped: data.skipped,
    };
  } catch {
    return { ok: false, message: "ネットワークエラーが発生しました" };
  }
}
