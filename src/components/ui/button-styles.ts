/**
 * 主操作ボタンの見た目。
 * 色を1つに固定すると、ダーク面かライト面のどちらかで沈むため、
 * 「載る面に対してコントラストの高い塗り」を方針にする。
 */

const disabled = "disabled:cursor-not-allowed disabled:opacity-50";

/** auth などダーク地の上。明るい塗りで主操作だと分かる */
export const primaryOnDarkButtonClassName = `rounded-md bg-zinc-100 px-3 py-2.5 text-sm font-medium text-zinc-900 ${disabled}`;

/** 表・白カードなどライト地の上。暗い塗り */
export const primaryOnLightButtonClass = {
  sm: `rounded-md bg-zinc-900 px-2 py-1 text-xs font-medium text-white ${disabled}`,
  md: `rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white ${disabled}`,
  compact: `rounded-md bg-zinc-900 px-2.5 py-1 text-xs font-medium text-white ${disabled}`,
  /** スキャン開始など、横に伸ばす主操作 */
  stretch: `bg-zinc-900 px-4 py-2 text-sm font-medium text-white ${disabled}`,
} as const;

/** auth フォームの送信（全幅） */
export const authPrimarySubmitClassName = `w-full ${primaryOnDarkButtonClassName}`;
