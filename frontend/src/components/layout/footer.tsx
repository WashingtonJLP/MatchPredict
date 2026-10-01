import Link from "next/link";

import { BrandMark } from "@/components/shared/brand-mark";

const footerLinks = [
  { href: "/daily-games", label: "Jogos do Dia" },
  { href: "/#ranking", label: "Ranking" },
  { href: "/rules", label: "Regras" },
];

const githubUrl = "https://github.com/WashingtonJLP/MatchPredict.git";

const linkClassName =
  "flex min-h-11 w-fit items-center rounded-md px-2 text-sm font-medium text-slate-400 transition-colors duration-200 hover:text-accent focus-visible:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none";

function GitHubMark() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className="size-4 transition-transform duration-200 group-hover:-translate-y-0.5 group-focus-visible:-translate-y-0.5 motion-reduce:transform-none motion-reduce:transition-none"
      aria-hidden="true"
    >
      <path d="M12 .5C5.73.5.5 5.73.5 12c0 5.02 3.44 9.27 8.21 10.78.6.11.82-.26.82-.58v-2.23c-3.34.73-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.21.09 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.39 1.24-3.23-.12-.3-.54-1.53.12-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.77.84 1.24 1.92 1.24 3.23 0 4.62-2.81 5.64-5.48 5.94.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.82.57A11.5 11.5 0 0 0 23.5 12C23.5 5.73 18.27.5 12 .5Z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer
      id="site-footer"
      className="border-t border-slate-800 bg-slate-950 text-slate-100"
    >
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-6 py-7 sm:flex-row sm:items-center sm:justify-between sm:gap-8 sm:py-8">
          <div className="max-w-sm">
            <BrandMark
              className="rounded-lg text-lg font-bold tracking-tight text-white focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-4 focus-visible:ring-offset-slate-950 [&>span:first-child]:border [&>span:first-child]:border-slate-700 [&>span:first-child]:bg-slate-900 [&>span:first-child]:text-white [&>span:first-child]:shadow-none"
            />
            <p className="mt-3 text-sm leading-6 text-slate-400">
              Partidas, palpites e ranking em um só lugar.
            </p>
          </div>

          <nav aria-label="Navegação do rodapé">
            <ul className="-ml-2 flex flex-wrap gap-x-1 sm:ml-0 sm:justify-end">
              {footerLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClassName}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="flex min-h-14 items-center justify-between gap-4 border-t border-slate-800 py-1">
          <p className="text-xs text-slate-400">
            © {new Date().getFullYear()} MatchPredict
          </p>

          <a
            href={githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="MatchPredict no GitHub (abre em nova aba)"
            className="group flex min-h-11 items-center gap-2 rounded-md px-2 text-sm font-medium text-slate-300 transition-colors duration-200 hover:text-accent focus-visible:text-accent focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transition-none"
          >
            <GitHubMark />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}
