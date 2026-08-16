"use client";

import { Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { BrandMark } from "@/components/shared/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/#ranking",
    label: "Ranking",
  },
  {
    href: "/rules",
    label: "Regras",
  },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-4 sm:h-[84px] sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-10 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-1 py-2 transition-colors duration-200 hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-2 md:flex">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 px-5 text-sm font-semibold text-muted-foreground hover:text-foreground",
            )}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-11 rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/80 hover:shadow-md",
            )}
          >
            Criar Conta
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
          aria-expanded={isOpen}
          className="flex size-11 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 md:hidden"
          onClick={() => setIsOpen((current) => !current)}
        >
          {isOpen ? (
            <X className="size-5" aria-hidden />
          ) : (
            <Menu className="size-5" aria-hidden />
          )}
        </button>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-primary/40 opacity-0 transition-opacity duration-200 md:hidden",
          isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none",
        )}
        aria-hidden
        onClick={() => setIsOpen(false)}
      />

      <aside
        className={cn(
          "fixed bottom-0 right-0 top-0 z-50 flex w-[min(86vw,22rem)] flex-col border-l border-border bg-card p-5 shadow-2xl transition-transform duration-200 md:hidden",
          isOpen ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-4">
          <BrandMark />
          <button
            type="button"
            aria-label="Fechar menu"
            className="flex size-11 items-center justify-center rounded-xl border border-border text-foreground transition hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50"
            onClick={() => setIsOpen(false)}
          >
            <X className="size-5" aria-hidden />
          </button>
        </div>

        <nav className="mt-8 grid gap-2 text-base font-semibold text-foreground">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-xl px-4 py-3 transition hover:bg-muted"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="mt-auto grid gap-3 pt-8">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "h-12 rounded-xl text-base font-semibold",
            )}
            onClick={() => setIsOpen(false)}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 rounded-xl bg-primary text-base font-semibold text-primary-foreground hover:bg-primary/80",
            )}
            onClick={() => setIsOpen(false)}
          >
            Criar Conta
          </Link>
        </div>
      </aside>
    </header>
  );
}
