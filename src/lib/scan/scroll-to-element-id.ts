/**
 * ページ内アンカーへスムーズスクロールする。
 * スキャン結果・登録一覧への移動で共通利用する（DOM 操作を hook に埋め込まない）。
 */

export function scrollToElementId(elementId: string): void {
  requestAnimationFrame(() => {
    document
      .getElementById(elementId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}
