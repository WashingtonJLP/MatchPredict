"use client";

import {
  BarChart3,
  CalendarDays,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Trophy,
  UserRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";

const sidebarLinks = [
  {
    href: "/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    href: "/matches",
    label: "Partidas",
    icon: CalendarDays,
  },
  {
    href: "/predictions",
    label: "Meus Palpites",
    icon: PieChart,
  },
  {
    href: "/dashboard#ranking",
    label: "Ranking",
    icon: Trophy,
  },
  {
    href: "/statistics",
    label: "Estatisticas",
    icon: BarChart3,
  },
  {
    href: "/profile",
    label: "Perfil",
    icon: UserRound,
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
};

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  function handleLogout() {
    setIsDrawerOpen(false);
    logout();
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-sidebar-border bg-sidebar px-5 py-6 lg:block">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-lg font-semibold text-sidebar-foreground"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
            <Trophy className="size-5" aria-hidden />
          </span>
          MatchPredict
        </Link>

        <nav className="mt-10 space-y-2">
          {sidebarLinks.map((item) => {
            const isActive =
              item.href.includes("#")
                ? false
                : item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          type="button"
          variant="ghost"
          className="mt-8 h-11 w-full justify-start gap-3 px-4 font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-5" aria-hidden />
          Sair
        </Button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-border bg-card">
          <div className="flex h-16 items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                aria-label="Abrir menu"
                aria-expanded={isDrawerOpen}
                className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
                onClick={() => setIsDrawerOpen(true)}
              >
                <Menu className="size-5" aria-hidden />
              </button>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground sm:text-sm">
                  Area logada
                </p>
                <p className="truncate text-base font-semibold text-card-foreground sm:text-lg">
                {user?.name ?? "MatchPredict"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar name={user?.name} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-card-foreground">
                  {user?.name ?? "Usuario"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {user?.email ?? "Sessao ativa"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Sair"
                onClick={handleLogout}
              >
                <LogOut className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </header>

        <nav className="grid grid-cols-3 gap-1 border-b border-border bg-card p-2 sm:grid-cols-6 lg:hidden">
          {sidebarLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex min-h-11 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <item.icon className="size-4" aria-hidden />
              {item.label.split(" ")[0]}
            </Link>
          ))}
        </nav>

        <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">{children}</main>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-primary/40 opacity-0 transition-opacity duration-200 lg:hidden",
          isDrawerOpen ? "pointer-events-auto opacity-100" : "pointer-events-none",
        )}
        aria-hidden
        onClick={() => setIsDrawerOpen(false)}
      />

      <aside
        className={cn(
          "fixed bottom-0 left-0 top-0 z-50 flex w-[min(86vw,22rem)] flex-col border-r border-sidebar-border bg-sidebar p-5 shadow-2xl transition-transform duration-200 lg:hidden",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-lg font-semibold text-sidebar-foreground"
            onClick={() => setIsDrawerOpen(false)}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground">
              <Trophy className="size-5" aria-hidden />
            </span>
            MatchPredict
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            className="flex size-11 items-center justify-center rounded-xl border border-sidebar-border text-sidebar-foreground transition hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-ring/50"
            onClick={() => setIsDrawerOpen(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="mt-8 space-y-2">
          {sidebarLinks.map((item) => {
            const isActive =
              item.href.includes("#")
                ? false
                : item.href === "/dashboard"
                  ? pathname === "/dashboard"
                  : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-sidebar-foreground/70 transition hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                  isActive &&
                    "bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground",
                )}
                onClick={() => setIsDrawerOpen(false)}
              >
                <item.icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Button
          type="button"
          variant="ghost"
          className="mt-auto h-11 w-full justify-start gap-3 px-4 font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground"
          onClick={handleLogout}
        >
          <LogOut className="size-5" aria-hidden />
          Sair
        </Button>
      </aside>
    </div>
  );
}
