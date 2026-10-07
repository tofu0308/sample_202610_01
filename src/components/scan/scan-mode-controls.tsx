/**
 * 単体 / 連続トグルとスキャン開始ボタン。
 */

type ScanModeControlsProps = {
  isContinuous: boolean;
  starting: boolean;
  overlayOpen: boolean;
  onToggleMode: () => void;
  onStart: () => void;
};

export function ScanModeControls({
  isContinuous,
  starting,
  overlayOpen,
  onToggleMode,
  onStart,
}: ScanModeControlsProps) {
  return (
    <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
      <button
        type="button"
        onClick={onToggleMode}
        disabled={overlayOpen || starting}
        aria-pressed={isContinuous}
        aria-label={
          isContinuous
            ? "連続読取モード。タップで単体に切り替え"
            : "単体読取モード。タップで連続に切り替え"
        }
        className="shrink-0 border-r border-zinc-300 bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-emerald-100 aria-pressed:text-emerald-900"
      >
        {isContinuous ? "連続" : "単体"}
      </button>
      <button
        type="button"
        onClick={onStart}
        disabled={overlayOpen || starting}
        className="flex-1 bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {starting
          ? "起動中…"
          : isContinuous
            ? "連続スキャン開始"
            : "スキャン開始"}
      </button>
    </div>
  );
}
