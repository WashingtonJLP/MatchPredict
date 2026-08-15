import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  ShieldCheck,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "Escolha as partidas",
    description:
      "Acompanhe a rodada e prepare seus palpites antes da bola rolar.",
    icon: CalendarCheck,
  },
  {
    title: "Registre seus placares",
    description:
      "Informe o resultado esperado e acompanhe sua performance rodada a rodada.",
    icon: CheckCircle2,
  },
  {
    title: "Suba no ranking",
    description:
      "Pontue por acertos, compare seu desempenho e dispute posicoes.",
    icon: Trophy,
  },
];

const features = [
  {
    title: "Ranking competitivo",
    description: "Classificacao por pontos, acertos exatos e desempates.",
    icon: BarChart3,
  },
  {
    title: "Perfil do jogador",
    description: "Base preparada para estatisticas e historico individual.",
    icon: Users,
  },
  {
    title: "Arquitetura segura",
    description: "Frontend pronto para autenticacao e consumo da API.",
    icon: ShieldCheck,
  },
];

const previewRows = [
  {
    position: "01",
    name: "Maria S.",
    points: "42 pts",
  },
  {
    position: "02",
    name: "Joao P.",
    points: "39 pts",
  },
  {
    position: "03",
    name: "Ana L.",
    points: "36 pts",
  },
];

export function LandingPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.14]">
          <div className="absolute left-1/2 top-0 h-full w-px bg-primary-foreground/80" />
          <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary-foreground/80" />
          <div className="absolute inset-x-8 bottom-8 top-8 border border-primary-foreground/80 sm:inset-x-12 sm:bottom-12 sm:top-12" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:min-h-[620px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:py-28">
          <div className="max-w-[650px]">
            <p className="mb-6 inline-flex rounded-lg border border-accent/40 px-4 py-2 text-sm font-semibold text-accent">
              Premier League predictions
            </p>
            <h1 className="text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              MatchPredict
            </h1>
            <p className="mt-5 max-w-[650px] text-base font-normal leading-7 text-primary-foreground/70 sm:mt-7 sm:text-xl sm:leading-8">
              Um produto esportivo para registrar palpites, acompanhar
              pontuacao e competir em rankings com uma experiencia rapida,
              limpa e profissional.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-7 text-base font-semibold bg-accent text-accent-foreground shadow-lg hover:bg-accent/90",
                )}
              >
                Criar Conta
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-7 text-base font-semibold border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground",
                )}
              >
                Entrar
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-primary-foreground/10 bg-card p-4 text-card-foreground shadow-2xl sm:p-6">
            <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Rodada 12
                </p>
                <h2 className="mt-1 text-xl font-semibold">Ranking ao vivo</h2>
              </div>
              <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                Aberto
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              {previewRows.map((row) => (
                <div
                  key={row.position}
                  className="flex items-center justify-between rounded-xl border border-border bg-muted px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-card hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                      {row.position}
                    </span>
                    <span className="text-base font-semibold">{row.name}</span>
                  </div>
                  <span className="text-base font-semibold text-accent">
                    {row.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-accent">
            Como funciona
          </p>
          <h2 className="mt-3 max-w-[650px] text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Da rodada ao ranking em poucos passos
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:p-8"
            >
              <step.icon className="size-8 text-accent" aria-hidden />
              <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[650px] text-base font-normal leading-7 text-muted-foreground">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-border bg-card">
        <div className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-accent">
              Funcionalidades
            </p>
            <h2 className="mt-3 max-w-[650px] text-3xl font-bold leading-tight text-card-foreground sm:text-4xl">
              Base preparada para as proximas sprints
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-muted p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border hover:bg-card hover:shadow-lg sm:p-8"
              >
                <feature.icon
                  className="size-8 text-foreground"
                  aria-hidden
                />
                <h3 className="mt-6 text-xl font-semibold text-card-foreground">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-[650px] text-base font-normal leading-7 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="rounded-2xl border border-border bg-primary px-5 py-10 text-primary-foreground shadow-xl sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div className="max-w-[650px]">
            <p className="text-sm font-semibold uppercase text-accent">
              Call To Action
            </p>
            <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
              Pronto para evoluir nas proximas sprints.
            </h2>
            <p className="mt-5 max-w-[650px] text-base font-normal leading-7 text-primary-foreground/70 sm:text-xl sm:leading-8">
              A interface esta estruturada para receber autenticacao, ranking,
              dashboard e integracao com a API sem reorganizar a base.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
