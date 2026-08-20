"use client";

import { usePathname } from "next/navigation";

import { AppToaster } from "@/components/layout/app-toaster";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { Footer } from "@/components/layout/footer";
import { Navbar } from "@/components/layout/navbar";
import { useAuth } from "@/providers/auth-provider";

type BaseLayoutProps = {
  children: React.ReactNode;
};

export function BaseLayout({ children }: BaseLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isLoading } = useAuth();
  const isPrivateRoute = [
    "/dashboard",
    "/matches",
    "/profile",
    "/predictions",
    "/statistics",
  ].some((route) => pathname.startsWith(route));
  const isRulesRoute = pathname.startsWith("/rules");

  if (isPrivateRoute) {
    return (
      <>
        {children}
        <AppToaster />
      </>
    );
  }

  if (isRulesRoute && isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppToaster />
      </div>
    );
  }

  if (isRulesRoute && isAuthenticated) {
    return (
      <>
        <DashboardShell>{children}</DashboardShell>
        <AppToaster />
      </>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <AppToaster />
    </div>
  );
}
