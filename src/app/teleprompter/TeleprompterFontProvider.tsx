"use client";

import { Inter, Open_Sans } from "next/font/google";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const openSans = Open_Sans({
  variable: "--font-open-sans",
  subsets: ["latin"],
  display: "swap",
});

export function TeleprompterFontProvider({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${inter.variable} ${openSans.variable} contents`}>{children}</div>
  );
}
