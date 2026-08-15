import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  {
    href: "/",
    label: "Home",
  },
  {
    href: "/#features",
    label: "Ranking",
  },
];

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card">
      <div className="mx-auto flex h-[84px] w-full max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <BrandMark />

        <nav className="hidden items-center gap-10 text-sm font-medium text-slate-600 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-1 py-2 tracking-[-0.01em] transition-colors duration-200 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "h-11 px-5 text-sm font-semibold text-slate-700 hover:text-slate-950",
            )}
          >
            Entrar
          </Link>
          <Link
            href="/register"
            className={cn(
              buttonVariants({ size: "sm" }),
              "h-11 rounded-xl bg-slate-950 px-6 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 hover:shadow-md",
            )}
          >
            Criar Conta
          </Link>
        </div>
      </div>
    </header>
  );
}
