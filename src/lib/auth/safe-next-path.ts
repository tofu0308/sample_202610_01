/**
 * ログイン後の戻り先を安全な同一オリジンパスに限定する。
 * /logout や API などは「戻る先」にしない（ログイン直後にまたログアウトへ飛ぶのを防ぐ）。
 */

export function safeNextPath(next: string | undefined | null): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/";
  }

  const pathOnly = next.split("?")[0] ?? next;

  if (
    pathOnly === "/logout" ||
    pathOnly.startsWith("/logout/") ||
    pathOnly.startsWith("/api/") ||
    pathOnly.startsWith("/auth/")
  ) {
    return "/";
  }

  return next;
}
