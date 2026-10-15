/**
 * 単体 / 連続のセグメント切替とスキャン開始ボタン。
 * 開始はライト面向け主ボタン（表・カードと同じ暗い塗り）。
 */

import { primaryOnLightButtonClass } from "@/components/ui/button-styles";
import type { ScanMode } from "@/lib/scan/types";

type ScanModeControlsProps = {
  scanMode: ScanMode;
  starting: boolean;
  overlayOpen: boolean;
  onSelectMode: (mode: ScanMode) => void;
  onStart: () => void;
};

export function ScanModeControls({
  scanMode,
  starting,
  overlayOpen,
  onSelectMode,
  onStart,
}: ScanModeControlsProps) {
  const disabled = overlayOpen || starting;
  const isContinuous = scanMode === "continuous";

  return (
    <div className="flex overflow-hidden rounded-md border border-zinc-300 shadow-sm">
      <div
        className="flex shrink-0 border-r border-zinc-300"
        role="group"
        aria-label="読取モード"
      >
        <button
          type="button"
          onClick={() => onSelectMode("single")}
          disabled={disabled}
          aria-pressed={!isContinuous}
          className="px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-emerald-100 aria-pressed:text-emerald-900 aria-pressed:hover:bg-emerald-100 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
        >
          単体
        </button>
        <button
          type="button"
          onClick={() => onSelectMode("continuous")}
          disabled={disabled}
          aria-pressed={isContinuous}
          className="border-l border-zinc-300 px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-50 aria-pressed:bg-emerald-100 aria-pressed:text-emerald-900 aria-pressed:hover:bg-emerald-100 bg-zinc-100 text-zinc-800 hover:bg-zinc-200"
        >
          連続
        </button>
      </div>
      <button
        type="button"
        onClick={onStart}
        disabled={disabled}
        className={`flex-1 ${primaryOnLightButtonClass.stretch}`}
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
