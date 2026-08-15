import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";

const footerLinks = [
  {
    href: "https://github.com",
    label: "GitHub",
  },
  {
    href: "/api/docs",
    label: "API Docs",
  },
  {
    href: "mailto:contato@matchpredict.app",
    label: "Contato",
  },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-12 sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
        <div className="space-y-4">
          <BrandMark />
          <p className="text-sm font-normal text-slate-500">
            Copyright {new Date().getFullYear()} MatchPredict.
          </p>
        </div>

        <nav className="flex flex-wrap gap-6 text-sm font-medium text-slate-600">
          {footerLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="transition-colors duration-200 hover:text-slate-950"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
