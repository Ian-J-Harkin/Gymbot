import React from "react"
import type { Metadata, Viewport } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { WidgetLoader } from "@/components/widget-loader";

import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

export const metadata: Metadata = {
  title: "FORGE | Private Training Club",
  description:
    "An exclusive boutique gymnasium for driven professionals. Performance training, personal coaching, and recovery — designed around your schedule.",
};

export const viewport: Viewport = {
  themeColor: "#161210",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <body className="font-sans antialiased" suppressHydrationWarning>
        {children}
        <WidgetLoader />
      </body>
    </html>
  );
}
