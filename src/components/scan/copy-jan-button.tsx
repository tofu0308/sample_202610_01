"use client";

/**
 * JAN をクリップボードへコピーする小さなボタン。
 * 単体・連続リストで同じ操作感に揃える。
 */

import { useState } from "react";
import { itemSecondaryButtonClass } from "@/components/items/item-action-styles";

type CopyJanButtonProps = {
  jan: string;
};

export function CopyJanButton({ jan }: CopyJanButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(jan);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className={itemSecondaryButtonClass.sm}
    >
      {copied ? "コピー済み" : "JANをコピー"}
    </button>
  );
}
