/**
 * auth 画面共通ヘッダ（プロダクト名＋画面タイトル）。
 * A5 / B1: どの画面でも同じアプリだと分かるようにする。
 */

import type { ReactNode } from "react";
import { AppBrandLink } from "@/components/app-brand-link";
import { authPageDescClassName } from "@/components/auth/form-styles";

type AuthPageHeaderProps = {
  title: string;
  description?: string;
  children?: ReactNode;
};

export function AuthPageHeader({
  title,
  description,
  children,
}: AuthPageHeaderProps) {
  return (
    <header className="space-y-3">
      <p>
        <AppBrandLink />
      </p>
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
        {title}
      </h1>
      {description ? (
        <p className={authPageDescClassName}>{description}</p>
      ) : null}
      {children}
    </header>
  );
}
