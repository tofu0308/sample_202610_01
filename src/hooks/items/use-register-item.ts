/**
 * 商品照会結果を POST /api/items で登録する Client hook。
 * 一覧の再取得（router.refresh）は onRegistered 側に任せるか、未指定時のみここで行う。
 */

import { useRouter } from "next/navigation";
import { useCallback, useState, useTransition } from "react";
import {
  postRegisterItem,
  type FoundProduct,
} from "@/lib/items/register-item-request";

type UseRegisterItemOptions = {
  /**
   * POST 成功後。一覧 refresh・読取クリアなどは呼び出し側。
   * 渡したときは hook 内で refresh しない（二重取得を避ける）。
   */
  onRegistered?: () => void;
};

export function useRegisterItem(options: UseRegisterItemOptions = {}) {
  const { onRegistered } = options;
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const register = useCallback(
    async (product: FoundProduct) => {
      setPosting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        const result = await postRegisterItem(product);

        if (!result.ok) {
          setError(result.message);
          return;
        }

        setSuccessMessage("登録しました");
        if (onRegistered) {
          onRegistered();
        } else {
          startTransition(() => {
            router.refresh();
          });
        }
      } catch {
        setError("登録処理でエラーが発生しました");
      } finally {
        setPosting(false);
      }
    },
    [onRegistered, router],
  );

  return {
    register,
    pending: posting || isRefreshing,
    error,
    successMessage,
  };
}

/**
 * 照会成功した複数件を登録する（連続リストのまとめて登録用）。
 * TODO: いまは POST /api/items を 1 件ずつ順呼び。次の工程で一括 API に差し替える。
 */
export function useRegisterItems(options: UseRegisterItemOptions = {}) {
  const { onRegistered } = options;
  const router = useRouter();
  const [isRefreshing, startTransition] = useTransition();
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const registerMany = useCallback(
    async (products: FoundProduct[]) => {
      if (products.length === 0) {
        return;
      }

      setPosting(true);
      setError(null);
      setSuccessMessage(null);

      try {
        let created = 0;
        let duplicates = 0;
        let failed = 0;
        let lastError: string | null = null;

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
        }

        if (created > 0) {
          if (onRegistered) {
            onRegistered();
          } else {
            startTransition(() => {
              router.refresh();
            });
          }
        } else if (duplicates > 0) {
          startTransition(() => {
            router.refresh();
          });
        }

        if (failed > 0) {
          setError(lastError ?? "一部の登録に失敗しました");
        } else if (created === 0 && duplicates === 0) {
          setError("登録できる商品がありませんでした");
        }
      } catch {
        setError("登録処理でエラーが発生しました");
      } finally {
        setPosting(false);
      }
    },
    [onRegistered, router],
  );

  return {
    registerMany,
    pending: posting || isRefreshing,
    error,
    successMessage,
  };
}
