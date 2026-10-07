/**
 * getUserMedia / html5-qrcode のエラーを画面向け文言に落とす。
 * 技術詳細は出さず、ユーザーが次に取れる行動が分かる文にする。
 */

export function toCameraFriendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  const lower = message.toLowerCase();

  if (
    lower.includes("notallowed") ||
    lower.includes("permission") ||
    lower.includes("denied")
  ) {
    return "カメラの使用が許可されませんでした。ブラウザの設定を確認してください。";
  }
  if (
    lower.includes("notfound") ||
    lower.includes("requested device not found")
  ) {
    return "利用できるカメラが見つかりませんでした。";
  }
  if (lower.includes("notsupported") || lower.includes("secure")) {
    return "この環境ではカメラを起動できません。HTTPS または localhost で開いてください。";
  }
  return message || "カメラの起動に失敗しました。";
}
