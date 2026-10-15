/**
 * 登録後の router.refresh（RSC 再取得）中に出す明示ローディング。
 * ボタン側の pending は POST 中だけなので、一覧反映待ちはこちらで補う。
 */

"use client";

import { createPortal } from "react-dom";

type ListUpdatingBannerProps = {
  active: boolean;
};

export function ListUpdatingBanner({ active }: ListUpdatingBannerProps) {
  if (!active || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <p className="rounded-md border border-zinc-600 bg-zinc-900/95 px-4 py-2.5 text-sm font-medium text-zinc-100 shadow-lg">
        一覧を更新しています…
      </p>
    </div>,
    document.body,
  );
}
