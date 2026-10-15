/**
 * スキャン全画面のヘッダ（状態文言＋閉じる／キャンセル）。
 * 主操作はフッタ側。ここは離脱用の短い操作だけ。
 */

type ScanOverlayHeaderProps = {
  isContinuous: boolean;
  starting: boolean;
  continuousCount: number;
  hasSingleResult: boolean;
  lookupPending: boolean;
  actionLabel: string;
  onAction: () => void;
};

export function ScanOverlayHeader({
  isContinuous,
  starting,
  continuousCount,
  hasSingleResult,
  lookupPending,
  actionLabel,
  onAction,
}: ScanOverlayHeaderProps) {
  const statusText = starting
    ? "カメラ起動中…"
    : isContinuous
      ? `連続読取（${continuousCount} 件）`
      : hasSingleResult
        ? lookupPending
          ? "商品を照会しています…"
          : "読取完了"
        : "コードを枠に合わせてください";

  return (
    <header className="flex shrink-0 items-center justify-between gap-3 px-4 py-3">
      <p className="text-sm font-medium">{statusText}</p>
      <button
        type="button"
        onClick={onAction}
        className="rounded-md bg-white/15 px-3 py-2 text-sm font-medium text-white"
      >
        {actionLabel}
      </button>
    </header>
  );
}
