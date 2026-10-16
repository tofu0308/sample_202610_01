/**
 * 登録一覧向け「スキャン検索」の流れ。
 * 所持ヒット → ハイライト。未所持 → 照会 → 確認 → 登録 → refresh 後ハイライト。
 */

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { findRegisteredItemByJan } from "@/lib/items/find-registered-item";
import {
  isRegisterBlockedByLimit,
  registerLimitHint,
  type ItemLimitView,
} from "@/lib/items/item-limit-view";
import { postRegisterItem } from "@/lib/items/register-item-request";
import { fetchProductLookup } from "@/lib/products/product-lookup-request";
import { normalizeBarcodeDigits } from "@/lib/scan/normalize-barcode";
import { scrollToElementId } from "@/lib/scan/scroll-to-element-id";

const HIGHLIGHT_MS = 4000;
const CONFIRM_REGISTER_MESSAGE =
  "まだ登録されていない商品です。登録しますか？";

type FindableRow = { id: string; jan: string };

type UseFindRegisteredItemOptions = {
  items: readonly FindableRow[];
  itemLimit: ItemLimitView;
  onClearFreeword: () => void;
};

export function useFindRegisteredItem({
  items,
  itemLimit,
  onClearFreeword,
}: UseFindRegisteredItemOptions) {
  const router = useRouter();
  const [manualValue, setManualValue] = useState("");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageTone, setMessageTone] = useState<"error" | "info">("info");
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const pendingHighlightJanRef = useRef<string | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHighlightTimer = useCallback(() => {
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
      highlightTimerRef.current = null;
    }
  }, []);

  const applyHighlight = useCallback(
    (itemId: string) => {
      onClearFreeword();
      setHighlightId(itemId);
      clearHighlightTimer();
      highlightTimerRef.current = setTimeout(() => {
        setHighlightId(null);
        highlightTimerRef.current = null;
      }, HIGHLIGHT_MS);
      scrollToElementId(`item-row-${itemId}`);
    },
    [clearHighlightTimer, onClearFreeword],
  );

  useEffect(() => {
    const jan = pendingHighlightJanRef.current;
    if (!jan) {
      return;
    }
    const found = findRegisteredItemByJan(items, jan);
    if (!found) {
      return;
    }
    pendingHighlightJanRef.current = null;
    applyHighlight(found.id);
  }, [items, applyHighlight]);

  useEffect(() => {
    return () => clearHighlightTimer();
  }, [clearHighlightTimer]);

  const runFind = useCallback(
    async (raw: string) => {
      setMessage(null);
      const code = normalizeBarcodeDigits(raw);
      if (!code) {
        setMessageTone("error");
        setMessage("JANコードは 8〜14 桁の数字で入力してください");
        return;
      }

      onClearFreeword();

      const owned = findRegisteredItemByJan(items, code);
      if (owned) {
        applyHighlight(owned.id);
        setManualValue("");
        setMessageTone("info");
        setMessage("登録済みの商品を一覧で強調表示しました");
        return;
      }

      if (isRegisterBlockedByLimit(itemLimit)) {
        setMessageTone("error");
        setMessage(
          registerLimitHint(itemLimit) ??
            "登録上限に達しているため、新規登録できません",
        );
        return;
      }

      setPending(true);
      try {
        const lookup = await fetchProductLookup(code);
        if (lookup.error || !lookup.data) {
          setMessageTone("error");
          setMessage(lookup.error ?? "商品情報の取得に失敗しました");
          return;
        }
        if (lookup.data.found !== true) {
          setMessageTone("error");
          setMessage("商品マスタに見つかりませんでした（未登録のままです）");
          return;
        }

        const accepted = window.confirm(CONFIRM_REGISTER_MESSAGE);
        if (!accepted) {
          setMessageTone("info");
          setMessage("登録をキャンセルしました");
          return;
        }

        const result = await postRegisterItem(lookup.data);
        if (!result.ok) {
          if (result.kind === "duplicate") {
            setMessageTone("error");
            setMessage(
              "すでに登録済みです。画面を更新してから再度お試しください",
            );
            router.refresh();
            return;
          }
          setMessageTone("error");
          setMessage(result.message);
          return;
        }

        pendingHighlightJanRef.current = code;
        setManualValue("");
        setMessageTone("info");
        setMessage("登録しました。一覧を更新しています…");
        router.refresh();
      } finally {
        setPending(false);
      }
    },
    [applyHighlight, itemLimit, items, onClearFreeword, router],
  );

  return {
    manualValue,
    setManualValue,
    pending,
    message,
    messageTone,
    highlightId,
    runFind,
  };
}
