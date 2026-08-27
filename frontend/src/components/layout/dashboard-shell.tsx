"use client";

import {
  BarChart3,
  BookOpen,
  CalendarDays,
  Eye,
  LayoutDashboard,
  LogOut,
  Menu,
  PieChart,
  Trophy,
  UserRound,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

type SidebarLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  emphasis?: boolean;
};

type SidebarSection = {
  label: string;
  links: SidebarLink[];
};

const sidebarSections: SidebarSection[] = [
  {
    label: "Principal",
    links: [
      {
        href: "/matches",
        label: "Partidas",
        icon: CalendarDays,
        emphasis: true,
      },
      {
        href: "/predictions",
        label: "Meus Palpites",
        icon: PieChart,
        emphasis: true,
      },
      {
        href: "/dashboard#ranking",
        label: "Ranking",
        icon: Trophy,
        emphasis: true,
      },
    ],
  },
  {
    label: "Acompanhar",
    links: [
      {
        href: "/dashboard",
        label: "Dashboard",
        icon: LayoutDashboard,
      },
      {
        href: "/transparency",
        label: "Transparência",
        icon: Eye,
      },
      {
        href: "/statistics",
        label: "Estatísticas",
        icon: BarChart3,
      },
    ],
  },
  {
    label: "Conta",
    links: [
      {
        href: "/rules",
        label: "Regras",
        icon: BookOpen,
      },
      {
        href: "/profile",
        label: "Perfil",
        icon: UserRound,
      },
    ],
  },
];

type DashboardShellProps = {
  children: React.ReactNode;
};

function splitHref(href: string) {
  const [path, hash] = href.split("#");

  return {
    path,
    hash: hash ? `#${hash}` : "",
  };
}

function isSidebarLinkActive(
  item: SidebarLink,
  pathname: string,
  currentHash: string,
) {
  const { path, hash } = splitHref(item.href);

  if (hash) {
    return pathname === path && currentHash === hash;
  }

  if (item.href === "/dashboard") {
    return pathname === "/dashboard" && currentHash !== "#ranking";
  }

  return pathname.startsWith(item.href);
}

export function DashboardShell({ children }: DashboardShellProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [currentHash, setCurrentHash] = useState("");
  const mobileLinks = useMemo(
    () => sidebarSections.flatMap((section) => section.links),
    [],
  );

  useEffect(() => {
    function updateHash() {
      setCurrentHash(window.location.hash);
    }

    updateHash();
    window.addEventListener("hashchange", updateHash);

    return () => {
      window.removeEventListener("hashchange", updateHash);
    };
  }, [pathname]);

  function handleLogout() {
    setIsDrawerOpen(false);
    toast.success("Logout realizado.");
    logout();
  }

  function renderSidebarLink(item: SidebarLink, onClick?: () => void) {
    const isActive = isSidebarLinkActive(item, pathname, currentHash);

    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "flex min-h-12 items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-accent/50",
          isActive &&
            "bg-accent text-accent-foreground shadow-lg shadow-accent/20 hover:bg-accent hover:text-accent-foreground",
        )}
        onClick={onClick}
      >
        <item.icon
          className={cn("size-[22px]", item.emphasis && "text-current")}
          aria-hidden
        />
        {item.label}
      </Link>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-primary/80 bg-primary px-5 py-6 shadow-xl shadow-primary/20 lg:block">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-primary-foreground focus-visible:ring-3 focus-visible:ring-accent/50"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
            <Trophy className="size-5" aria-hidden />
          </span>
          MatchPredict
        </Link>

        <nav className="mt-8 space-y-7" aria-label="Navegação principal">
          {sidebarSections.map((section) => (
            <div key={section.label} className="space-y-2">
              <p className="px-4 text-xs font-extrabold uppercase tracking-wide text-primary-foreground">
                {section.label}
              </p>
              <div className="space-y-1.5">
                {section.links.map((item) => renderSidebarLink(item))}
              </div>
            </div>
          ))}
        </nav>

        <Button
          type="button"
          variant="ghost"
          className="mt-8 h-12 w-full justify-start gap-3 px-4 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
          onClick={handleLogout}
        >
          <LogOut className="size-5" aria-hidden />
          Sair
        </Button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur">
          <div className="flex h-[72px] items-center justify-between gap-3 px-4 sm:h-20 sm:px-6 lg:px-8">
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
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
                  Área logada
                </p>
                <p className="truncate text-lg font-extrabold leading-tight text-card-foreground sm:text-xl">
                  {user?.name ?? "MatchPredict"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar name={user?.name} />
              <div className="hidden text-right sm:block">
                <p className="text-base font-bold leading-tight text-card-foreground">
                  {user?.name ?? "Usuário"}
                </p>
                <p className="mt-1 text-xs font-medium text-muted-foreground">
                  {user?.email ?? "Sessão ativa"}
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

        <nav
          className="flex gap-1 overflow-x-auto border-b border-border bg-card p-2 lg:hidden"
          aria-label="Navegação principal"
        >
          {mobileLinks.map((item) => {
            const isActive = isSidebarLinkActive(item, pathname, currentHash);

            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex min-h-12 min-w-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
                  item.emphasis && "text-foreground",
                  isActive && "bg-muted text-foreground",
                )}
              >
                <item.icon className="size-5" aria-hidden />
                <span className="max-w-20 truncate">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
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
          "fixed bottom-0 left-0 top-0 z-50 flex w-[min(86vw,22rem)] flex-col border-r border-primary/80 bg-primary p-5 shadow-2xl transition-transform duration-200 lg:hidden",
          isDrawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-xl font-extrabold tracking-tight text-primary-foreground focus-visible:ring-3 focus-visible:ring-accent/50"
            onClick={() => setIsDrawerOpen(false)}
          >
            <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
              <Trophy className="size-5" aria-hidden />
            </span>
            MatchPredict
          </Link>
          <button
            type="button"
            aria-label="Fechar menu"
            className="flex size-11 items-center justify-center rounded-xl border border-primary-foreground/20 text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-accent/50"
            onClick={() => setIsDrawerOpen(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="mt-8 space-y-7" aria-label="Navegação principal">
          {sidebarSections.map((section) => (
            <div key={section.label} className="space-y-2">
              <p className="px-4 text-xs font-extrabold uppercase tracking-wide text-primary-foreground">
                {section.label}
              </p>
              <div className="space-y-1.5">
                {section.links.map((item) =>
                  renderSidebarLink(item, () => setIsDrawerOpen(false)),
                )}
              </div>
            </div>
          ))}
        </nav>

        <Button
          type="button"
          variant="ghost"
          className="mt-auto h-12 w-full justify-start gap-3 px-4 text-base font-semibold text-primary-foreground hover:bg-primary-foreground/10"
          onClick={handleLogout}
        >
          <LogOut className="size-5" aria-hidden />
          Sair
        </Button>
      </aside>
    </div>
  );
}
