/**
 * プロダクト名の共通表示（Client 可）。
 * error.tsx など Client 境界からも同じ見た目で使えるようにする。
 */

"use client";

import Link from "next/link";
import { APP_NAME } from "@/lib/app-name";

type AppBrandLinkProps = {
  /** 未指定時はトップへ */
  href?: string;
  className?: string;
};

export function AppBrandLink({
  href = "/",
  className = "text-sm font-medium text-zinc-400 transition-colors hover:text-zinc-200",
}: AppBrandLinkProps) {
  return (
    <Link href={href} className={className}>
      {APP_NAME}
    </Link>
  );
}
