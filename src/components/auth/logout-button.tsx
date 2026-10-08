/**
 * ヘッダ用ログアウト（POST /logout）。
 */

export function LogoutButton() {
  return (
    <form action="/logout" method="post">
      <button
        type="submit"
        className="rounded-md border border-zinc-300 px-2.5 py-1 text-xs text-zinc-700 hover:bg-zinc-50"
      >
        ログアウト
      </button>
    </form>
  );
}
