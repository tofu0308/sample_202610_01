import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import type { ReactNode } from "react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ブラウザタブ・検索向け。画面上のプロダクト名（A5）と揃える想定
export const metadata: Metadata = {
  title: "消耗品インベントリ",
  description:
    "バーコードで商品を調べ、所持・残量・メモを管理する学習用アプリ",
};

// LayoutProps は next typegen 生成型。CI では未生成のため ReactNode で受ける
export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
