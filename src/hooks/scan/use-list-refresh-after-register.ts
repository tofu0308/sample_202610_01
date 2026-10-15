/**
 * 登録成功後の一覧反映 UX。
 * router.refresh と下部バナー、一覧セクションへのスクロールをまとめる。
 * 読取結果のクリアは呼び出し側（スキャン状態機械と混ぜない）。
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState, useTransition } from "react";
import { scrollToElementId } from "@/lib/scan/scroll-to-element-id";

type RefreshListOptions = {
  /** 既定は登録一覧 `#items` */
  scrollToId?: string;
};

export function useListRefreshAfterRegister() {
  const router = useRouter();
  const [isListRefreshing, startListTransition] = useTransition();
  /** 読取クリアでボタンが消えても、refresh 完了までバナーを出すための旗 */
  const [listUpdating, setListUpdating] = useState(false);

  useEffect(() => {
    if (listUpdating && !isListRefreshing) {
      setListUpdating(false);
    }
  }, [isListRefreshing, listUpdating]);

  const refreshListAndScroll = useCallback(
    (options?: RefreshListOptions) => {
      setListUpdating(true);
      startListTransition(() => {
        router.refresh();
      });
      scrollToElementId(options?.scrollToId ?? "items");
    },
    [router],
  );

  return {
    listUpdating: listUpdating || isListRefreshing,
    refreshListAndScroll,
  };
}
