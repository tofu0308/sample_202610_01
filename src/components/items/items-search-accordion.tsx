"use client";

/**
 * 一覧の検索入口。フリーワードとスキャン検索をアコーディオンで切り替える。
 * 同時に両方開かない（スキャン時はフリーワード解除は hook 側）。
 */

import { useState, type ReactNode } from "react";

type SearchPanel = "freeword" | "scan";

type ItemsSearchAccordionProps = {
  freeword: ReactNode;
  scan: ReactNode;
};

export function ItemsSearchAccordion({
  freeword,
  scan,
}: ItemsSearchAccordionProps) {
  const [open, setOpen] = useState<SearchPanel>("freeword");

  return (
    <div className="-mx-1 space-y-2 rounded-lg border border-zinc-200 bg-white px-3 py-2">
      <div className="flex gap-1 rounded-md bg-zinc-100 p-0.5" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={open === "freeword"}
          onClick={() => setOpen("freeword")}
          className={
            open === "freeword"
              ? "flex-1 rounded px-2 py-1.5 text-xs font-medium text-zinc-900 bg-white shadow-sm"
              : "flex-1 rounded px-2 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          }
        >
          フリーワード
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={open === "scan"}
          onClick={() => setOpen("scan")}
          className={
            open === "scan"
              ? "flex-1 rounded px-2 py-1.5 text-xs font-medium text-zinc-900 bg-white shadow-sm"
              : "flex-1 rounded px-2 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-900"
          }
        >
          スキャン検索
        </button>
      </div>
      <div role="tabpanel">{open === "freeword" ? freeword : scan}</div>
    </div>
  );
}
