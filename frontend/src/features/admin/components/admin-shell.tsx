"use client";

import { Dialog } from "@base-ui/react/dialog";
import { ArrowLeft, LogOut, Menu, ShieldCheck, X } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  adminNavigationItems,
  isAdminRouteActive,
  type AdminNavigationItem,
} from "@/features/admin/admin-navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace("/login");
      return;
    }
    if (user?.role !== "ADMIN") router.replace("/dashboard");
  }, [isAuthenticated, isLoading, router, user?.role]);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 1024px)");
    const closeOnDesktop = (event: MediaQueryListEvent) => {
      if (event.matches) setDrawerOpen(false);
    };

    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  if (isLoading || !user || user.role !== "ADMIN") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="rounded-2xl border border-border bg-card px-6 py-5 text-center shadow-sm">
          <ShieldCheck className="mx-auto size-7 text-accent" aria-hidden />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">
            Validando autorização administrativa…
          </p>
        </div>
      </div>
    );
  }

  function closeDrawer() {
    setDrawerOpen(false);
  }

  function handleLogout() {
    closeDrawer();
    logout();
  }

  return (
    <div className="min-h-screen min-w-0 overflow-x-hidden bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-primary px-4 py-6 text-primary-foreground shadow-xl shadow-primary/20 lg:flex">
        <AdminIdentity />

        <nav
          className="mt-8 flex-1 space-y-1.5"
          aria-label="Navegação administrativa"
        >
          {adminNavigationItems.map((item) => (
            <AdminNavLink
              key={item.href}
              item={item}
              pathname={pathname}
              variant="sidebar"
            />
          ))}
        </nav>

        <AdminUtilityLinks onLogout={handleLogout} />
      </aside>

      <div className="min-w-0 lg:pl-64">
        <Dialog.Root open={drawerOpen} onOpenChange={setDrawerOpen}>
          <header className="sticky top-0 z-40 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex h-16 items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 lg:h-20 lg:px-8">
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-extrabold text-card-foreground">
                  Administração
                </p>
                <p className="truncate text-xs font-semibold text-muted-foreground">
                  Operações restritas
                </p>
              </div>
              <div className="flex min-w-0 shrink-0 items-center gap-2 sm:gap-3">
                <UserAvatar name={user.name} size="sm" />
                <div className="hidden min-w-0 text-right sm:block">
                  <p className="max-w-44 truncate text-sm font-bold text-card-foreground">
                    {user.name}
                  </p>
                  <p className="max-w-44 truncate text-xs text-muted-foreground">
                    {user.email}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Sair"
                  onClick={handleLogout}
                  className="hidden lg:inline-flex"
                >
                  <LogOut className="size-4" aria-hidden />
                </Button>
                <Dialog.Trigger
                  ref={menuButtonRef}
                  aria-label="Abrir menu administrativo"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 lg:hidden"
                >
                  <Menu className="size-5" aria-hidden />
                </Dialog.Trigger>
              </div>
            </div>

            <AdminQuickNavigation pathname={pathname} />
          </header>

          <Dialog.Portal>
            <Dialog.Backdrop className="fixed inset-0 z-50 min-h-dvh bg-primary/55 transition-opacity duration-200 data-ending-style:opacity-0 data-starting-style:opacity-0 lg:hidden" />
            <Dialog.Popup
              initialFocus={closeButtonRef}
              finalFocus={menuButtonRef}
              className="fixed inset-y-0 left-0 z-[60] flex max-h-dvh w-[min(88vw,22rem)] flex-col overflow-hidden border-r border-primary/80 bg-primary p-5 text-primary-foreground shadow-2xl transition-transform duration-200 data-ending-style:-translate-x-full data-starting-style:-translate-x-full lg:hidden"
            >
              <div className="flex shrink-0 items-center justify-between gap-4">
                <AdminIdentity onSelect={closeDrawer} />
                <Dialog.Close
                  ref={closeButtonRef}
                  aria-label="Fechar menu administrativo"
                  className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary-foreground/20 text-primary-foreground transition hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-accent/50"
                >
                  <X className="size-5" aria-hidden />
                </Dialog.Close>
              </div>

              <Dialog.Title className="sr-only">
                Menu administrativo
              </Dialog.Title>
              <Dialog.Description className="sr-only">
                Navegação completa da área administrativa do MatchPredict.
              </Dialog.Description>

              <nav
                className="mt-8 min-h-0 flex-1 space-y-1.5 overflow-y-auto overscroll-contain pb-4 [scrollbar-width:thin]"
                aria-label="Menu administrativo completo"
              >
                {adminNavigationItems.map((item) => (
                  <AdminNavLink
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    variant="sidebar"
                    onSelect={closeDrawer}
                  />
                ))}
              </nav>

              <AdminUtilityLinks
                onNavigate={closeDrawer}
                onLogout={handleLogout}
              />
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>

        <main className="mx-auto min-w-0 w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
          {children}
        </main>
      </div>
    </div>
  );
}

function AdminIdentity({ onSelect }: { onSelect?: () => void }) {
  return (
    <Link
      href="/admin"
      className="flex min-w-0 items-center gap-3 rounded-xl px-2 py-1 focus-visible:ring-3 focus-visible:ring-accent/50"
      onClick={onSelect}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground">
        <ShieldCheck className="size-5" aria-hidden />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-lg font-extrabold leading-tight">
          Administração
        </span>
        <span className="block text-xs font-semibold text-primary-foreground/65">
          MatchPredict
        </span>
      </span>
    </Link>
  );
}

function AdminNavLink({
  item,
  onSelect,
  pathname,
  variant,
}: {
  item: AdminNavigationItem;
  onSelect?: () => void;
  pathname: string;
  variant: "sidebar" | "quick";
}) {
  const active = isAdminRouteActive(pathname, item.href);

  return (
    <Link
      href={item.href}
      aria-current={active ? "page" : undefined}
      className={cn(
        variant === "sidebar"
          ? "flex min-h-12 items-center gap-3 rounded-xl px-4 text-sm font-bold transition-colors focus-visible:ring-3 focus-visible:ring-accent/50"
          : "flex min-h-11 shrink-0 items-center gap-2 rounded-lg px-3 text-xs font-bold text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50",
        variant === "sidebar" &&
          (active
            ? "bg-accent text-accent-foreground"
            : "text-primary-foreground/80 hover:bg-primary-foreground/10 hover:text-primary-foreground"),
        variant === "quick" && active && "bg-primary text-primary-foreground",
      )}
      onClick={onSelect}
    >
      <item.icon
        className={variant === "sidebar" ? "size-5" : "size-4"}
        aria-hidden
      />
      {item.label}
    </Link>
  );
}

function AdminQuickNavigation({ pathname }: { pathname: string }) {
  const navigationRef = useRef<HTMLElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollHints = useCallback(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    setCanScrollLeft(navigation.scrollLeft > 1);
    setCanScrollRight(
      navigation.scrollLeft + navigation.clientWidth <
        navigation.scrollWidth - 1,
    );
  }, []);

  useEffect(() => {
    const navigation = navigationRef.current;
    if (!navigation) return;

    const activeItem = navigation.querySelector<HTMLElement>(
      '[aria-current="page"]',
    );
    activeItem?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
      inline: "center",
    });

    const frame = window.requestAnimationFrame(updateScrollHints);
    const observer = new ResizeObserver(updateScrollHints);
    observer.observe(navigation);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [pathname, updateScrollHints]);

  return (
    <div className="relative min-w-0 overflow-hidden border-t border-border lg:hidden">
      <nav
        ref={navigationRef}
        className="flex w-full max-w-full gap-1 overflow-x-auto px-2 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        aria-label="Atalhos administrativos"
        onScroll={updateScrollHints}
      >
        {adminNavigationItems.map((item) => (
          <AdminNavLink
            key={item.href}
            item={item}
            pathname={pathname}
            variant="quick"
          />
        ))}
      </nav>
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-card to-transparent transition-opacity",
          canScrollLeft ? "opacity-100" : "opacity-0",
        )}
      />
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent transition-opacity",
          canScrollRight ? "opacity-100" : "opacity-0",
        )}
      />
    </div>
  );
}

function AdminUtilityLinks({
  onLogout,
  onNavigate,
}: {
  onLogout: () => void;
  onNavigate?: () => void;
}) {
  return (
    <div className="shrink-0 space-y-2 border-t border-primary-foreground/15 pt-4">
      <Link
        href="/dashboard"
        className="flex min-h-11 items-center gap-3 rounded-xl px-4 text-sm font-semibold text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-accent/50"
        onClick={onNavigate}
      >
        <ArrowLeft className="size-4" aria-hidden />
        Voltar ao produto
      </Link>
      <button
        type="button"
        className="flex min-h-11 w-full items-center gap-3 rounded-xl px-4 text-sm font-semibold text-primary-foreground/80 transition-colors hover:bg-primary-foreground/10 focus-visible:ring-3 focus-visible:ring-accent/50"
        onClick={onLogout}
      >
        <LogOut className="size-4" aria-hidden />
        Sair
      </button>
    </div>
  );
}
