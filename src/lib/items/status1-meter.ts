/**
 * status1 の残量メーター表示用メタデータ。
 * 塗り幅＝多さの目安、色＝緑（十分）→赤（要補充）の段階。
 */

import {
  isStatus1Option,
  type Status1Option,
} from "@/lib/items/constants";

export type Status1MeterStyle = {
  /** バーの塗り幅（%） */
  fillPercent: number;
  /** バー本体（グラデーション） */
  barClassName: string;
  /** ラベル文字色（バーの上でも読めるよう濃い色） */
  labelClassName: string;
};

export const STATUS1_METER_STYLE: Record<Status1Option, Status1MeterStyle> = {
  満タン: {
    fillPercent: 100,
    barClassName: "bg-gradient-to-r from-emerald-400 to-emerald-600",
    labelClassName: "text-emerald-950",
  },
  余裕あり: {
    fillPercent: 80,
    barClassName: "bg-gradient-to-r from-lime-400 to-lime-600",
    labelClassName: "text-lime-950",
  },
  半分: {
    fillPercent: 50,
    barClassName: "bg-gradient-to-r from-amber-300 to-amber-500",
    labelClassName: "text-amber-950",
  },
  残少: {
    fillPercent: 28,
    barClassName: "bg-gradient-to-r from-orange-400 to-orange-600",
    labelClassName: "text-orange-950",
  },
  要補充: {
    fillPercent: 12,
    barClassName: "bg-gradient-to-r from-rose-400 to-rose-600",
    labelClassName: "text-rose-950",
  },
};

export function getStatus1MeterStyle(
  value: string | null,
): Status1MeterStyle | null {
  if (value == null || !isStatus1Option(value)) {
    return null;
  }
  return STATUS1_METER_STYLE[value];
}
