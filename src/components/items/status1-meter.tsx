/**
 * ステータスセル用の残量バー。
 * 背景を棒グラフ風に塗り、5段階の色で一目で残量感が分かるようにする。
 */

import { getStatus1MeterStyle } from "@/lib/items/status1-meter";

type Status1MeterProps = {
  value: string | null;
  /** 編集中プレビューなど、少し低くするとき */
  compact?: boolean;
};

export function Status1Meter({ value, compact = false }: Status1MeterProps) {
  const style = getStatus1MeterStyle(value);
  const heightClass = compact ? "h-6" : "h-8";
  // 一覧は「—」、編集プレビューは「未設定」で空を示す
  const emptyLabel = compact ? "未設定" : "—";
  const label = value && value.length > 0 ? value : emptyLabel;

  if (!style) {
    return (
      <div
        className={`flex ${heightClass} w-36 items-center rounded-md border border-dashed border-zinc-200 bg-zinc-50 px-2 text-xs text-zinc-400`}
      >
        {label}
      </div>
    );
  }

  return (
    <div
      className={`relative ${heightClass} w-36 overflow-hidden rounded-md border border-zinc-200 bg-zinc-100`}
      title={label}
    >
      <div
        className={`absolute inset-y-0 left-0 ${style.barClassName}`}
        style={{ width: `${style.fillPercent}%` }}
        aria-hidden
      />
      <span
        className={`relative z-10 flex h-full items-center px-2 text-xs font-medium ${style.labelClassName}`}
      >
        {label}
      </span>
    </div>
  );
}
