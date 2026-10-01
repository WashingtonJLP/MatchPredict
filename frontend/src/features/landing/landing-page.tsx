"use client";

import {
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock3,
  Edit3,
  LineChart,
  Medal,
  Shield,
  Trophy,
  Users,
} from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { useStandings } from "@/hooks/use-standings";
import { cn } from "@/lib/utils";

const steps = [
  {
    title: "⚽ Escolha as partidas",
    description:
      "Veja os jogos disponíveis da Premier League e acompanhe data, horário e status de cada confronto.",
    icon: CalendarCheck,
  },
  {
    title: "Faça seus palpites",
    description:
      "Registre o placar que você acredita antes da bola rolar e ajuste quando a partida ainda estiver aberta.",
    icon: CheckCircle2,
  },
  {
    title: "Suba no ranking",
    description:
      "Some pontos a cada rodada, dispute posições e acompanhe seu desempenho contra outros jogadores.",
    icon: Trophy,
  },
];

const features = [
  {
    title: "Palpites em tempo real",
    description: "Registre seus placares e acompanhe rapidamente o status dos seus palpites.",
    icon: Clock3,
  },
  {
    title: "Ranking atualizado",
    description: "Veja a classificação geral com posição, pontuação e disputa entre jogadores.",
    icon: BarChart3,
  },
  {
    title: "Estatísticas do jogador",
    description: "Acompanhe pontos, aproveitamento, acertos e evolução durante a temporada.",
    icon: LineChart,
  },
  {
    title: "Partidas da Premier League",
    description: "Tenha uma visão organizada dos jogos, rodadas, clubes e horários da competição.",
    icon: Shield,
  },
  {
    title: "Edição de palpites",
    description: "Altere seu palpite enquanto a partida ainda estiver disponível para edição.",
    icon: Edit3,
  },
  {
    title: "Competição entre usuários",
    description: "Compare seu desempenho com outros participantes e dispute as primeiras posições.",
    icon: Users,
  },
];

const stats = [
  {
    value: "380",
    label: "partidas",
  },
  {
    value: "20",
    label: "clubes",
  },
  {
    value: "38",
    label: "rodadas",
  },
  {
    value: "Tempo real",
    label: "ranking",
  },
];

export function LandingPage() {
  const standingsQuery = useStandings();
  const topStandings = standingsQuery.data?.slice(0, 3) ?? [];

  return (
    <>
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 opacity-[0.14]">
          <div className="absolute left-1/2 top-0 h-full w-px bg-primary-foreground/80" />
          <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary-foreground/80" />
          <div className="absolute inset-x-8 bottom-8 top-8 border border-primary-foreground/80 sm:inset-x-12 sm:bottom-12 sm:top-12" />
        </div>

        <div className="relative mx-auto grid min-h-[calc(100svh-4rem)] w-full max-w-6xl min-w-0 items-center gap-10 px-4 py-16 sm:px-6 sm:py-24 lg:min-h-[620px] lg:grid-cols-[1.08fr_0.92fr] lg:gap-16 lg:px-8 lg:py-28">
          <div className="min-w-0 max-w-[650px]">
            <p className="mb-6 inline-flex rounded-lg border border-accent/40 px-4 py-2 text-sm font-semibold text-accent">
              Premier League predictions
            </p>
            <h1 className="break-words text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              MatchPredict
            </h1>
            <p className="mt-5 max-w-[650px] text-base font-normal leading-7 text-primary-foreground/70 sm:mt-7 sm:text-xl sm:leading-8">
              Faça seus palpites da Premier League, acompanhe sua pontuação em tempo real e dispute posição no ranking contra outros jogadores.
            </p>
            <div className="mt-10 flex min-w-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 w-full px-7 text-base font-semibold bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 sm:w-auto",
                )}
              >
                Criar Conta
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full px-7 text-base font-semibold border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto",
                )}
              >
                Entrar
              </Link>
              <Link
                href="/rules"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full px-7 text-base font-semibold border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto",
                )}
              >
                Ver regras
              </Link>
            </div>
          </div>

          <div
            id="ranking"
            className="min-w-0 scroll-mt-24 rounded-2xl border border-primary-foreground/10 bg-card p-4 text-card-foreground shadow-2xl sm:p-6"
          >
            <div className="flex min-w-0 items-center justify-between gap-4 border-b border-border pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-muted-foreground">
                  Ranking
                </p>
                <h2 className="mt-1 text-xl font-semibold">Top 3 jogadores</h2>
              </div>
              <span className="rounded-lg bg-accent/10 px-3 py-1.5 text-xs font-semibold text-accent">
                Ao vivo
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              {standingsQuery.isLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-[74px] rounded-xl border border-border bg-muted"
                  />
                ))
              ) : standingsQuery.isError || !topStandings.length ? (
                <div className="rounded-xl border border-border bg-muted px-4 py-5 text-sm font-medium text-muted-foreground">
                  Ranking indisponível no momento.
                </div>
              ) : (
                topStandings.map((row) => (
                  <div
                    key={row.userId}
                    className="flex min-w-0 items-center justify-between gap-3 rounded-xl border border-border bg-muted px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent hover:bg-card hover:shadow-md"
                  >
                    <div className="flex min-w-0 items-center gap-4">
                      <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
                        {row.position}
                      </span>
                      <span className="truncate text-base font-semibold">
                        {row.name}
                      </span>
                    </div>
                    <span className="shrink-0 text-base font-semibold text-accent">
                      {row.totalPoints} pts
                    </span>
                  </div>
                ))
              )}
            </div>

            <Link
              href="/dashboard#ranking"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "mt-5 w-full border-accent/40 text-accent hover:bg-accent/10 hover:text-accent",
              )}
            >
              Ver ranking completo
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-accent">
            Como funciona
          </p>
          <h2 className="mt-3 max-w-[650px] break-words text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Da escolha dos jogos à disputa pelo topo
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
          {steps.map((step) => (
            <article
              key={step.title}
              className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:p-8"
            >
              <step.icon className="size-8 text-accent" aria-hidden />
              <h3 className="mt-6 break-words text-xl font-semibold text-card-foreground">
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
            <h2 className="mt-3 max-w-[650px] break-words text-3xl font-bold leading-tight text-card-foreground sm:text-4xl">
              Tudo para acompanhar sua temporada de palpites
            </h2>
          </div>

          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="min-w-0 rounded-2xl border border-border bg-muted p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-border hover:bg-card hover:shadow-lg sm:p-8"
              >
                <feature.icon
                  className="size-8 text-foreground"
                  aria-hidden
                />
                <h3 className="mt-6 break-words text-xl font-semibold text-card-foreground">
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
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-accent">
            Estatísticas
          </p>
          <h2 className="mt-3 max-w-[650px] break-words text-3xl font-bold leading-tight text-foreground sm:text-4xl">
            Uma temporada completa para disputar
          </h2>
        </div>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4 lg:gap-6">
          {stats.map((stat) => (
            <article
              key={stat.label}
              className="min-w-0 rounded-2xl border border-border bg-card p-6 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-accent hover:shadow-lg sm:p-8"
            >
              <Medal className="size-8 text-accent" aria-hidden />
              <p className="mt-6 text-3xl font-extrabold leading-none text-card-foreground">
                {stat.value}
              </p>
              <p className="mt-3 text-base font-semibold text-muted-foreground">
                {stat.label}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 pb-16 sm:px-6 sm:pb-20 lg:px-8 lg:pb-24">
        <div className="rounded-2xl border border-border bg-primary px-5 py-10 text-primary-foreground shadow-xl sm:px-8 sm:py-12 lg:px-12 lg:py-14">
          <div className="max-w-[650px]">
            <p className="text-sm font-semibold uppercase text-accent">
              Comece agora
            </p>
            <h2 className="mt-3 break-words text-3xl font-bold leading-tight sm:text-4xl">
              Pronto para entrar na disputa?
            </h2>
            <p className="mt-5 max-w-[650px] text-base font-normal leading-7 text-primary-foreground/70 sm:text-xl sm:leading-8">
              Crie sua conta gratuitamente e comece a subir no ranking da Premier League.
            </p>
            <div className="mt-8 flex min-w-0 flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 w-full px-7 text-base font-semibold bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 sm:w-auto",
                )}
              >
                Criar Conta
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full px-7 text-base font-semibold border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto",
                )}
              >
                Entrar
              </Link>
              <Link
                href="/rules"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 w-full px-7 text-base font-semibold border-primary-foreground/25 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground sm:w-auto",
                )}
              >
                Ver regras
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
