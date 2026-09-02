import type { Metadata } from "next";
import { Suspense } from "react";

import { DailyGamesPageContent } from "@/features/daily-games/components/daily-games-page-content";
import { DailyGamesLoading } from "@/features/daily-games/components/daily-games-loading";

export const metadata: Metadata = {
  title: "Jogos do Dia | MatchPredict",
  description:
    "Veja jogos de futebol por data, com horários, status, placares e competições.",
  alternates: {
    canonical: "/daily-games",
  },
};

export default function DailyGamesPage() {
  return (
    <Suspense fallback={<DailyGamesPageFallback />}>
      <DailyGamesPageContent />
    </Suspense>
  );
}

function DailyGamesPageFallback() {
  return (
    <div className="bg-background font-sans">
      <section className="bg-primary text-primary-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-7 sm:px-6 sm:py-9 lg:px-8">
          <div className="h-12 w-72 max-w-full rounded bg-primary-foreground/15 motion-safe:animate-pulse" />
          <div className="mt-4 h-5 w-full max-w-xl rounded bg-primary-foreground/10 motion-safe:animate-pulse" />
        </div>
      </section>
      <main className="mx-auto w-full max-w-6xl space-y-4 px-4 py-5 sm:px-6 sm:py-7 lg:px-8">
        <DailyGamesLoading />
      </main>
    </div>
  );
}
