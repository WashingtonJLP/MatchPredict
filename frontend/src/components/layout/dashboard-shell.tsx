"use client";

import {
  BarChart3,
  LayoutDashboard,
  LogOut,
  PieChart,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

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

  return (
    <div className="min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-72 border-r border-border bg-white px-5 py-6 lg:block">
        <Link
          href="/dashboard"
          className="flex items-center gap-3 text-lg font-semibold text-slate-950"
        >
          <span className="flex size-10 items-center justify-center rounded-xl bg-slate-950 text-white">
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
                  "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-950",
                  isActive && "bg-slate-950 text-white hover:bg-slate-950 hover:text-white",
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
          className="mt-8 h-11 w-full justify-start gap-3 px-4 font-semibold text-slate-600 hover:text-slate-950"
          onClick={logout}
        >
          <LogOut className="size-5" aria-hidden />
          Sair
        </Button>
      </aside>

      <div className="lg:pl-72">
        <header className="sticky top-0 z-40 border-b border-border bg-white">
          <div className="flex h-20 items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-medium text-slate-500">Area logada</p>
              <p className="text-lg font-semibold text-slate-950">
                {user?.name ?? "MatchPredict"}
              </p>
            </div>

            <div className="flex items-center gap-3">
              <UserAvatar name={user?.name} />
              <div className="hidden text-right sm:block">
                <p className="text-sm font-semibold text-slate-950">
                  {user?.name ?? "Usuario"}
                </p>
                <p className="text-xs text-slate-500">
                  {user?.email ?? "Sessao ativa"}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="Sair"
                onClick={logout}
              >
                <LogOut className="size-4" aria-hidden />
              </Button>
            </div>
          </div>
        </header>

        <nav className="grid grid-cols-5 gap-1 border-b border-border bg-white p-2 lg:hidden">
          {sidebarLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[11px] font-medium text-slate-600"
            >
              <item.icon className="size-4" aria-hidden />
              {item.label.split(" ")[0]}
            </Link>
          ))}
        </nav>

        <main className="px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
