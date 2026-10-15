/**
 * 登録成功後の一覧反映 UX。
 * router.refresh と下部バナー、一覧セクションへのスクロールをまとめる。
 * 読取結果のクリアは呼び出し側（スキャン状態機械と混ぜない）。
 */

import { useRouter } from "next/navigation";
import { useCallback, useTransition } from "react";
import { scrollToElementId } from "@/lib/scan/scroll-to-element-id";

type RefreshListOptions = {
  /** 既定は登録一覧 `#items` */
  scrollToId?: string;
};

export function useListRefreshAfterRegister() {
  const router = useRouter();
  const [isListRefreshing, startListTransition] = useTransition();

  const refreshListAndScroll = useCallback(
    (options?: RefreshListOptions) => {
      startListTransition(() => {
        router.refresh();
      });
      scrollToElementId(options?.scrollToId ?? "items");
    },
    [router],
  );

  return {
    listUpdating: isListRefreshing,
    refreshListAndScroll,
  };
}
