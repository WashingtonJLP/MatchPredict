import type { Metadata } from "next";
import { Geist } from "next/font/google";

import { BaseLayout } from "@/components/layout/base-layout";
import { AppProviders } from "@/providers/app-providers";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore Next.js supports global CSS side-effect imports in app/layout.
import "./globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://matchpredict.com.br"),
  title: "MatchPredict",
  description: "Palpites esportivos com ranking competitivo.",
  icons: {
    icon: [{ url: "/icon.svg", type: "image/svg+xml" }],
  },
  openGraph: {
    title: "MatchPredict",
    description: "Palpites esportivos com ranking competitivo.",
    url: "https://matchpredict.com.br",
    siteName: "MatchPredict",
    images: [
      {
        url: "/MatchPredict.png",
        width: 1536,
        height: 1024,
        alt: "MatchPredict",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "MatchPredict",
    description: "Palpites esportivos com ranking competitivo.",
    images: ["/MatchPredict.png"],
  },
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
