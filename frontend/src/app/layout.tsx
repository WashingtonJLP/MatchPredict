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

const siteUrl = "https://matchpredict.com.br";
const title = "MatchPredict";
const description = "Palpites esportivos com ranking competitivo.";
const ogImage = "/og-matchpredict.jpg";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title,
  description,
  manifest: "/manifest.webmanifest",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title,
    description,
    url: siteUrl,
    siteName: title,
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "MatchPredict - Palpites esportivos com ranking competitivo",
        type: "image/jpeg",
      },
    ],
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
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
