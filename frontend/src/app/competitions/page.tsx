import type { Metadata } from "next";
import { Suspense } from "react";

import {
  CompetitionsPageContent,
  CompetitionsPageSkeleton,
} from "@/features/competitions/components/competitions-page-content";

export const metadata: Metadata = {
  title: "Competições | MatchPredict",
  description:
    "Acompanhe jogos, classificações, grupos e fases eliminatórias de 12 grandes competições de futebol.",
  alternates: {
    canonical: "/competitions",
  },
};

export default function CompetitionsPage() {
  return (
    <Suspense fallback={<CompetitionsPageSkeleton />}>
      <CompetitionsPageContent />
    </Suspense>
  );
}
