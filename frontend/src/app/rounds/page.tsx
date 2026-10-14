"use client";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { RoundsPageContent } from "@/features/rounds/components/rounds-page-content";

export default function RoundsPage() {
  return (
    <DashboardShell>
      <RoundsPageContent />
    </DashboardShell>
  );
}
