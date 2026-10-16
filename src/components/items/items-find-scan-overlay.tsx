"use client";

/**
 * スキャン検索用の全画面カメラ（portal 先）。
 * 登録用 ScanOverlay より単純で、読取→探す処理に渡すだけ。
 */

type ItemsFindScanOverlayProps = {
  regionId: string;
  starting: boolean;
  cameraError: string | null;
  onCancel: () => void;
};

export function ItemsFindScanOverlay({
  regionId,
  starting,
  cameraError,
  onCancel,
}: ItemsFindScanOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex flex-col bg-black text-white"
      role="dialog"
      aria-modal="true"
      aria-label="登録済み商品をスキャン検索"
    >
      <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))]">
        <p className="text-sm font-medium">
          {starting ? "カメラ起動中…" : "コードを枠に合わせてください"}
        </p>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
        >
          キャンセル
        </button>
      </header>

      <div
        id={regionId}
        className="min-h-0 flex-1 basis-0 overflow-hidden [&_img]:mx-auto [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
      />

      <footer className="shrink-0 space-y-2 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {cameraError ? (
          <p className="text-sm text-red-300" role="alert">
            {cameraError}
          </p>
        ) : (
          <p className="text-sm text-zinc-300">
            登録済みなら一覧で強調、未登録なら確認後に登録できます。
          </p>
        )}
      </footer>
    </div>
  );
}
