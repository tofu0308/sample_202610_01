/**
 * 一覧表示用の日時フォーマット。
 * 端末のタイムゾーンに左右されないよう、常に Asia/Tokyo・分まで出す。
 */

const jstDateTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export function formatDateTimeJst(iso: string): string {
  return new Date(iso).toLocaleString("ja-JP", jstDateTimeOptions);
}
