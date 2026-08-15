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
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 opacity-[0.14]">
          <div className="absolute left-1/2 top-0 h-full w-px bg-white/80" />
          <div className="absolute left-1/2 top-1/2 size-72 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/80" />
          <div className="absolute inset-x-8 bottom-8 top-8 border border-white/80 sm:inset-x-12 sm:bottom-12 sm:top-12" />
        </div>

        <div className="relative mx-auto grid min-h-[620px] w-full max-w-6xl items-center gap-16 px-4 py-28 sm:px-6 sm:py-32 lg:grid-cols-[1.08fr_0.92fr] lg:px-8">
          <div className="max-w-[650px]">
            <p className="mb-6 inline-flex rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-semibold text-emerald-300">
              Premier League predictions
            </p>
            <h1 className="text-6xl font-extrabold leading-tight tracking-tight">
              MatchPredict
            </h1>
            <p className="mt-7 max-w-[650px] text-xl font-normal leading-8 text-slate-300">
              Um produto esportivo para registrar palpites, acompanhar
              pontuacao e competir em rankings com uma experiencia rapida,
              limpa e profissional.
            </p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/register"
                className={cn(
                  buttonVariants({ size: "lg" }),
                  "h-12 px-7 text-base font-semibold bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950/20 hover:bg-emerald-400",
                )}
              >
                Criar Conta
              </Link>
              <Link
                href="/login"
                className={cn(
                  buttonVariants({ variant: "outline", size: "lg" }),
                  "h-12 px-7 text-base font-semibold border-white/25 bg-transparent text-white hover:bg-white/10 hover:text-white",
                )}
              >
                Entrar
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white p-6 text-slate-950 shadow-2xl shadow-slate-950/30">
            <div className="flex items-center justify-between border-b border-slate-200 pb-5">
              <div>
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Rodada 12
                </p>
                <h2 className="mt-1 text-xl font-semibold">Ranking ao vivo</h2>
              </div>
              <span className="rounded-lg bg-emerald-100 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                Aberto
              </span>
            </div>

            <div className="mt-5 space-y-3.5">
              {previewRows.map((row) => (
                <div
                  key={row.position}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-white hover:shadow-md"
                >
                  <div className="flex items-center gap-4">
                    <span className="flex size-10 items-center justify-center rounded-lg bg-slate-950 text-sm font-semibold text-white">
                      {row.position}
                    </span>
                    <span className="text-base font-semibold">{row.name}</span>
                  </div>
                  <span className="text-base font-semibold text-emerald-600">
                    {row.points}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase text-emerald-600">
            Como funciona
          </p>
          <h2 className="mt-3 max-w-[650px] text-4xl font-bold text-slate-950">
            Da rodada ao ranking em poucos passos
          </h2>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <article
              key={step.title}
              className="rounded-2xl border border-border bg-card p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
            >
              <step.icon className="size-8 text-emerald-600" aria-hidden />
              <h3 className="mt-6 text-xl font-semibold text-slate-950">
                {step.title}
              </h3>
              <p className="mt-3 max-w-[650px] text-base font-normal leading-7 text-slate-600">
                {step.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section id="features" className="border-y border-border bg-white">
        <div className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase text-emerald-600">
              Funcionalidades
            </p>
            <h2 className="mt-3 max-w-[650px] text-4xl font-bold text-slate-950">
              Base preparada para as proximas sprints
            </h2>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-border bg-slate-50 p-8 shadow-sm transition duration-200 hover:-translate-y-1 hover:border-slate-300 hover:bg-white hover:shadow-lg"
              >
                <feature.icon
                  className="size-8 text-slate-950"
                  aria-hidden
                />
                <h3 className="mt-6 text-xl font-semibold text-slate-950">
                  {feature.title}
                </h3>
                <p className="mt-3 max-w-[650px] text-base font-normal leading-7 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 py-24 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-border bg-slate-950 px-8 py-14 text-white shadow-xl shadow-slate-950/10 sm:px-12">
          <div className="max-w-[650px]">
            <p className="text-sm font-semibold uppercase text-emerald-300">
              Call To Action
            </p>
            <h2 className="mt-3 text-4xl font-bold">
              Pronto para evoluir nas proximas sprints.
            </h2>
            <p className="mt-5 max-w-[650px] text-xl font-normal leading-8 text-slate-300">
              A interface esta estruturada para receber autenticacao, ranking,
              dashboard e integracao com a API sem reorganizar a base.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
