/**
 * 商品画像サムネ。外部ホストが可変のため next/image は使わず img。
 * 一覧・読取結果でサイズだけ差し替える。
 */

type ProductThumbnailProps = {
  imageUrl?: string | null;
  /** 一辺の px（表示クラスも揃える） */
  size?: 40 | 48;
};

const sizeClass = {
  40: "h-10 w-10",
  48: "h-12 w-12",
} as const;

export function ProductThumbnail({
  imageUrl,
  size = 40,
}: ProductThumbnailProps) {
  const box = sizeClass[size];

  if (imageUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- 外部ホストが可変のため
      <img
        src={imageUrl}
        alt=""
        width={size}
        height={size}
        className={`${box} shrink-0 rounded border border-zinc-200 object-cover`}
      />
    );
  }

  return (
    <div
      className={`flex ${box} shrink-0 items-center justify-center rounded border border-dashed border-zinc-200 bg-zinc-50 text-[9px] text-zinc-400`}
      aria-hidden
    >
      —
    </div>
  );
}
