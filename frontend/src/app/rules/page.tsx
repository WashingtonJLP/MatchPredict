import {
  CalendarClock,
  Check,
  CircleDot,
  Equal,
  Info,
  LockKeyhole,
  Medal,
  RefreshCw,
  Trophy,
  X,
} from "lucide-react";
import Link from "next/link";

import { SectionTitle } from "@/components/shared/section-title";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const scoringRows = [
  {
    rule: "Acertou o placar exato",
    prediction: "2 x 1",
    result: "2 x 1",
    points: "+3 pontos",
    pointsClass: "bg-emerald-100 text-emerald-700 border-emerald-200",
    icon: Check,
  },
  {
    rule: "Acertou apenas o vencedor",
    prediction: "4 x 2",
    result: "2 x 1",
    points: "+1 ponto",
    pointsClass: "bg-sky-100 text-sky-700 border-sky-200",
    icon: Trophy,
  },
  {
    rule: "Acertou apenas o empate",
    prediction: "3 x 3",
    result: "1 x 1",
    points: "+1 ponto",
    pointsClass: "bg-sky-100 text-sky-700 border-sky-200",
    icon: Equal,
  },
  {
    rule: "Errou vencedor ou empate",
    prediction: "1 x 2",
    result: "2 x 1",
    points: "0 ponto",
    pointsClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: X,
  },
];

const howItWorks = [
  "O sistema sempre compara o seu palpite com o resultado oficial da partida.",
  "Se você acertar exatamente o placar, recebe 3 pontos.",
  "Se errar o placar, mas acertar quem venceu ou acertar que terminou empatado, recebe 1 ponto.",
  "Se errar vencedor ou empate, não recebe pontos.",
];

const predictionFlow = [
  {
    title: "Antes da partida",
    icon: CalendarClock,
    tone: "text-accent bg-accent/10 border-accent/20",
    items: [
      "Você pode criar um palpite.",
      "Pode editar quantas vezes desejar.",
    ],
  },
  {
    title: "Após o início da partida",
    icon: LockKeyhole,
    tone: "text-foreground bg-muted border-border",
    items: ["O palpite é bloqueado.", "Não é possível alterar."],
  },
  {
    title: "Após o resultado",
    icon: RefreshCw,
    tone: "text-sky-700 bg-sky-100 border-sky-200",
    items: ["O sistema calcula automaticamente sua pontuação."],
  },
];

const rankingRules = [
  "Cada placar exato vale 3 pontos.",
  "Cada vencedor correto vale 1 ponto.",
  "Os jogadores são classificados pela pontuação total.",
  "Em caso de empate, o sistema aplica os critérios atuais de desempate.",
];

export default function RulesPage() {
  return (
    <div className="bg-background">
      <section className="border-b border-border bg-card">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-9 sm:px-6 lg:flex-row lg:items-end lg:justify-between lg:px-8">
          <div className="max-w-3xl">
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Regras
            </p>
            <h1 className="mt-3 text-3xl font-extrabold leading-tight text-card-foreground sm:text-4xl">
              Como funciona a pontuação
            </h1>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Ganhe pontos acertando o placar exato, o vencedor ou o empate.
            </p>
          </div>

          <Link
            href="/predictions"
            className={cn(
              buttonVariants({ size: "lg" }),
              "h-12 w-full px-6 text-base font-semibold sm:w-auto",
            )}
          >
            Fazer palpites
          </Link>
        </div>
      </section>

      <main className="mx-auto w-full max-w-6xl space-y-10 px-4 py-10 sm:px-6 lg:px-8">
        <section className="space-y-5">
          <SectionTitle
            eyebrow="Pontuação"
            title="Tabela rápida"
            description="Veja a regra, compare o exemplo e confira quantos pontos entram no ranking."
          />

          <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm">
            <div className="grid grid-cols-[1.1fr_1fr_auto] gap-4 border-b border-border bg-muted px-4 py-3 text-xs font-bold uppercase tracking-wide text-muted-foreground max-md:hidden">
              <span>Regra</span>
              <span>Exemplo</span>
              <span className="text-right">Pontos</span>
            </div>

            <div className="divide-y divide-border">
              {scoringRows.map((row) => (
                <article
                  key={row.rule}
                  className="grid gap-4 px-4 py-5 md:grid-cols-[1.1fr_1fr_auto] md:items-center"
                >
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-border bg-background text-accent">
                      <row.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <p className="text-xs font-bold uppercase text-muted-foreground md:hidden">
                        Regra
                      </p>
                      <h2 className="text-base font-bold text-foreground">
                        {row.rule}
                      </h2>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <ScoreExample label="Palpite" score={row.prediction} />
                    <ScoreExample label="Resultado" score={row.result} />
                  </div>

                  <div className="md:text-right">
                    <span
                      className={cn(
                        "inline-flex min-w-28 justify-center rounded-lg border px-3 py-2 text-sm font-extrabold",
                        row.pointsClass,
                      )}
                    >
                      {row.points}
                    </span>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Como funciona"
            title="A lógica em poucos segundos"
          />

          <div className="grid gap-3 md:grid-cols-2">
            {howItWorks.map((text, index) => (
              <article
                key={text}
                className="flex gap-3 rounded-lg border border-border bg-card p-4"
              >
                <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent/10 text-sm font-extrabold text-accent">
                  {index + 1}
                </span>
                <p className="text-sm font-medium leading-6 text-card-foreground sm:text-base">
                  {text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Palpites"
            title="Como funcionam os palpites"
          />

          <div className="grid gap-4 md:grid-cols-3">
            {predictionFlow.map((card) => (
              <article
                key={card.title}
                className="rounded-lg border border-border bg-card p-5 shadow-sm"
              >
                <span
                  className={cn(
                    "flex size-11 items-center justify-center rounded-lg border",
                    card.tone,
                  )}
                >
                  <card.icon className="size-5" aria-hidden />
                </span>
                <h2 className="mt-4 text-lg font-bold text-card-foreground">
                  {card.title}
                </h2>
                <ul className="mt-4 space-y-3">
                  {card.items.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm font-medium leading-6 text-muted-foreground"
                    >
                      <Check className="mt-0.5 size-4 shrink-0 text-accent" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Ranking"
            title="Como funciona o ranking"
            description="Sua posição depende da soma dos pontos processados em todos os seus palpites."
          />

          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="grid gap-3 sm:grid-cols-2">
              {rankingRules.map((rule) => (
                <article
                  key={rule}
                  className="flex gap-3 rounded-lg border border-border bg-card p-4"
                >
                  <CircleDot className="mt-1 size-5 shrink-0 text-accent" />
                  <p className="text-sm font-medium leading-6 text-card-foreground">
                    {rule}
                  </p>
                </article>
              ))}
            </div>

            <div className="rounded-lg border border-border bg-primary p-5 text-primary-foreground">
              <Medal className="size-7 text-accent" aria-hidden />
              <p className="mt-4 text-sm font-bold uppercase tracking-wide text-accent">
                Resumo
              </p>
              <p className="mt-2 text-2xl font-extrabold">3, 1 ou 0</p>
              <p className="mt-3 text-sm leading-6 text-primary-foreground/70">
                Placar exato soma mais. Resultado correto ainda conta. Erro não
                pontua.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-5">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex gap-3">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                <Info className="size-5" aria-hidden />
              </span>
              <div>
                <h2 className="font-bold text-card-foreground">
                  Pronto para palpitar?
                </h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Consulte as partidas abertas e registre seu placar antes do
                  início do jogo.
                </p>
              </div>
            </div>
            <Link
              href="/predictions"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full sm:w-auto",
              )}
            >
              Ver partidas
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function ScoreExample({ label, score }: { label: string; score: string }) {
  return (
    <div className="rounded-lg border border-border bg-muted px-3 py-2">
      <p className="text-xs font-bold uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-mono text-2xl font-extrabold text-foreground">
        {score}
      </p>
    </div>
  );
}
