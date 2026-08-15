import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { BaseLayout } from "@/components/layout/base-layout";
import { AppProviders } from "@/providers/app-providers";

import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MatchPredict",
  description: "Palpites esportivos com ranking competitivo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body className={`${geist.variable} antialiased`}>
        <AppProviders>
          <BaseLayout>{children}</BaseLayout>
        </AppProviders>
      </body>
    </html>
  );
}
