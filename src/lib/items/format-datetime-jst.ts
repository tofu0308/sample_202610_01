/**
 * 一覧表示用の日時フォーマット。
 * 端末のタイムゾーンに左右されないよう、常に Asia/Tokyo・分まで出す。
 */

const jstDateOptions: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Tokyo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
};

const jstTimeOptions: Intl.DateTimeFormatOptions = {
  timeZone: "Asia/Tokyo",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
};

export type DateTimeJstParts = {
  date: string;
  time: string;
};

/** 表セル向け。日付と時刻を分けて 2 行表示できるようにする */
export function formatDateTimeJstParts(iso: string): DateTimeJstParts {
  const value = new Date(iso);
  return {
    date: value.toLocaleDateString("ja-JP", jstDateOptions),
    time: value.toLocaleTimeString("ja-JP", jstTimeOptions),
  };
}

export function formatDateTimeJst(iso: string): string {
  const { date, time } = formatDateTimeJstParts(iso);
  return `${date} ${time}`;
}
