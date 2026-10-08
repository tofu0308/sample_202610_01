/**
 * 商品照会結果を POST /api/items で登録する Client hook。
 * 成功後は router.refresh() でサーバの登録一覧を更新する。
 */

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import {
  postRegisterItem,
  type FoundProduct,
} from "@/lib/items/register-item-request";

export function useRegisterItem() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const register = useCallback(
    async (product: FoundProduct) => {
      setPending(true);
      setError(null);
      setSuccessMessage(null);

      const result = await postRegisterItem(product);

      if (!result.ok) {
        setError(result.message);
        setPending(false);
        return;
      }

      setSuccessMessage("登録しました");
      router.refresh();
      setPending(false);
    },
    [router],
  );

  return { register, pending, error, successMessage };
}

/**
 * 照会成功した複数件を登録する（連続リストのまとめて登録用）。
 * TODO: いまは POST /api/items を 1 件ずつ順呼び。次の工程で一括 API
 * （例: 複数件をまとめたボディ／カンマ区切りなど）に差し替える。
 */
export function useRegisterItems() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const registerMany = useCallback(
    async (products: FoundProduct[]) => {
      if (products.length === 0) {
        return;
      }

      setPending(true);
      setError(null);
      setSuccessMessage(null);

      let created = 0;
      let duplicates = 0;
      let failed = 0;
      let lastError: string | null = null;

      // TODO: 一括 API ができたらこのループをやめる
      for (const product of products) {
        const result = await postRegisterItem(product);
        if (result.ok) {
          created += 1;
          continue;
        }
        if (result.kind === "duplicate") {
          duplicates += 1;
          continue;
        }
        failed += 1;
        lastError = result.message;
      }

      const parts: string[] = [];
      if (created > 0) {
        parts.push(`${created} 件登録`);
      }
      if (duplicates > 0) {
        parts.push(`${duplicates} 件は登録済み`);
      }
      if (failed > 0) {
        parts.push(`${failed} 件失敗`);
      }

      if (created > 0 || duplicates > 0) {
        setSuccessMessage(parts.join(" / ") || "完了");
        router.refresh();
      }

      if (failed > 0) {
        setError(lastError ?? "一部の登録に失敗しました");
      } else if (created === 0 && duplicates === 0) {
        setError("登録できる商品がありませんでした");
      }

      setPending(false);
    },
    [router],
  );

  return { registerMany, pending, error, successMessage };
}
