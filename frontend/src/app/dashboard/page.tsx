"use client";

import {
  BookOpen,
  CalendarDays,
  Gauge,
  Hash,
  Medal,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionTitle } from "@/components/shared/section-title";
import { StatCard } from "@/components/shared/stat-card";
import { UserAvatar } from "@/components/shared/user-avatar";
import { buttonVariants } from "@/components/ui/button";
import { PredictionFixtureCard } from "@/features/matches/components/prediction-fixture-card";
import { PredictionModal } from "@/features/matches/components/prediction-modal";
import { useFixtures } from "@/hooks/use-fixtures";
import { useStandings } from "@/hooks/use-standings";
import { useMe, useMyStatistics } from "@/hooks/use-user";
import { useAuth } from "@/providers/auth-provider";
import { cn } from "@/lib/utils";
import type { MatchFixture } from "@/types/fixture";
import type { Standing } from "@/types/standing";

function getPositionTone(position: number) {
  if (position === 1) {
    return "bg-accent text-accent-foreground shadow-accent/20";
  }

  if (position <= 3) {
    return "bg-primary text-primary-foreground shadow-primary/15";
  }

  return "bg-muted text-foreground";
}

function getPositionLabel(position: number) {
  if (position === 1) {
    return "Líder";
  }

  if (position <= 3) {
    return "Top 3";
  }

  return "Classificado";
}

function formatExactScoresLabel(value: number) {
  return `${value} ${value === 1 ? "placar exato" : "placares exatos"}`;
}

function formatCorrectWinnersLabel(value: number) {
  return `${value} ${
    value === 1 ? "vencedor correto" : "vencedores corretos"
  }`;
}

export default function DashboardPage() {
  const upcomingFrom = useMemo(() => new Date().toISOString(), []);
  const [selectedFixture, setSelectedFixture] = useState<MatchFixture | null>(
    null,
  );
  const { user: authUser } = useAuth();
  const meQuery = useMe();
  const statisticsQuery = useMyStatistics();
  const fixturesQuery = useFixtures({
    page: 1,
    limit: 6,
    from: upcomingFrom,
  });
  const standingsQuery = useStandings();
  const user = meQuery.data ?? authUser;
  const statistics = statisticsQuery.data;
  const standings = standingsQuery.data ?? [];
  const topStandings = standings.slice(0, 3);
  const myStanding = standings.find((item) => item.userId === authUser?.id);

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Dashboard"
          description="Acompanhe seu perfil e a classificação geral da temporada ativa."
        />

        {meQuery.isLoading || statisticsQuery.isLoading ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <LoadingCard key={index} rows={2} />
            ))}
          </div>
        ) : meQuery.isError || statisticsQuery.isError ? (
          <ErrorState
            icon={UserRound}
            title="Não foi possível carregar seu painel"
            description="Tente recarregar a página ou entrar novamente."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Trophy}
              title="Sua posição"
              value={
                statistics?.currentPosition
                  ? `#${statistics.currentPosition}`
                  : "-"
              }
              description={`${user?.name ?? "Usuário"}, esta é sua posição atual no ranking.`}
            />
            <StatCard
              icon={Target}
              title="Seus pontos"
              value={statistics?.totalPoints ?? 0}
              description="Pontuação acumulada na temporada ativa."
            />
            <StatCard
              icon={Gauge}
              title="Aproveitamento"
              value={`${statistics?.accuracy ?? 0}%`}
              description="Percentual de desempenho dos palpites processados."
            />
            <StatCard
              icon={Hash}
              title="Total de palpites"
              value={statistics?.totalPredictions ?? 0}
              description="Quantidade de palpites registrados na sua conta."
            />
          </div>
        )}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent">
                <BookOpen className="size-6" aria-hidden />
              </span>
              <div>
                <h2 className="text-xl font-extrabold text-card-foreground">
                  Como funciona a pontuação
                </h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
                  Placar exato vale 3 pontos. Resultado correto vale 1 ponto.
                  Erro não pontua.
                </p>
              </div>
            </div>
            <Link
              href="/rules"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 w-full font-semibold md:w-auto",
              )}
            >
              Ver regras
            </Link>
          </div>
        </section>

        <section className="space-y-5">
          <SectionTitle
            eyebrow="Palpites"
            title="Próximos palpites"
            description="Acesse rapidamente as próximas partidas para registrar ou ajustar seus palpites."
          />

          {fixturesQuery.isLoading ? (
            <div className="grid gap-5 xl:grid-cols-2">
              {Array.from({ length: 3 }).map((_, index) => (
                <LoadingCard key={index} rows={4} />
              ))}
            </div>
          ) : fixturesQuery.isError ? (
            <ErrorState
              icon={CalendarDays}
              title="Próximas partidas indisponíveis"
              description="Não foi possível carregar os próximos palpites agora."
            />
          ) : !fixturesQuery.data?.data.length ? (
            <EmptyState
              icon={CalendarDays}
              title="Sem próximas partidas"
              description="Novas partidas aparecerão aqui quando forem sincronizadas."
            />
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              {fixturesQuery.data.data.map((fixture) => (
                <PredictionFixtureCard
                  key={fixture.id}
                  fixture={fixture}
                  onPredict={setSelectedFixture}
                />
              ))}
            </div>
          )}
        </section>

        <section id="ranking" className="scroll-mt-28 space-y-5 sm:scroll-mt-32">
          <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm shadow-primary/5">
            <div className="bg-primary px-5 py-6 text-primary-foreground sm:px-6 lg:px-7">
              <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                <div className="max-w-[720px]">
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
                      <Trophy className="size-5" aria-hidden />
                    </span>
                    <h2 className="text-2xl font-extrabold leading-tight sm:text-3xl">
                      Classificação geral
                    </h2>
                  </div>
                  <p className="mt-3 max-w-[650px] text-base leading-7 text-primary-foreground/75">
                    Ranking da temporada ativa por pontuação, placares exatos e
                    vencedores corretos.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 md:min-w-80">
                  <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/70">
                      Sua posição
                    </p>
                    <p className="mt-2 text-3xl font-extrabold leading-none tabular-nums">
                      {myStanding ? `#${myStanding.position}` : "-"}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 px-4 py-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/70">
                      Participantes
                    </p>
                    <p className="mt-2 text-3xl font-extrabold leading-none tabular-nums">
                      {standings.length}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 sm:p-5 lg:p-6">
              {standingsQuery.isLoading ? (
                <LoadingCard rows={7} />
              ) : standingsQuery.isError ? (
                <ErrorState
                  icon={Trophy}
                  title="Ranking indisponível"
                  description="Não foi possível carregar a classificação agora."
                />
              ) : !standings.length ? (
                <EmptyState
                  icon={Trophy}
                  title="Sem dados de ranking"
                  description="O ranking aparecerá quando houver classificações processadas."
                />
              ) : (
                <RankingBoard
                  standings={standings}
                  currentUserId={authUser?.id}
                  topStandings={topStandings}
                />
              )}
            </div>
          </div>
        </section>

        <PredictionModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
        />
      </div>
    </DashboardShell>
  );
}

type RankingBoardProps = {
  standings: Standing[];
  currentUserId?: string;
  topStandings: Standing[];
};

function RankingBoard({
  standings,
  currentUserId,
  topStandings,
}: RankingBoardProps) {
  return (
    <div className="space-y-5">
      <div className="lg:hidden">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Top 3
        </h3>
        <div className="mt-3 overflow-hidden rounded-2xl border border-border bg-background">
          {topStandings.map((standing) => {
            const isCurrentUser = standing.userId === currentUserId;

            return (
              <div
                key={standing.userId}
                className={cn(
                  "grid grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
                  isCurrentUser && "bg-accent/10",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 items-center justify-center rounded-xl text-sm font-extrabold shadow-sm tabular-nums",
                    getPositionTone(standing.position),
                  )}
                >
                  {standing.position}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-foreground">
                    {standing.name}
                  </p>
                  {isCurrentUser ? (
                    <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-accent">
                      Você
                    </p>
                  ) : null}
                </div>
                <p className="text-right text-base font-extrabold text-accent tabular-nums">
                  {standing.totalPoints} pts
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="hidden gap-3 lg:grid lg:grid-cols-3">
        {topStandings.map((standing) => {
          const isCurrentUser = standing.userId === currentUserId;

          return (
            <article
              key={standing.userId}
              className={cn(
                "min-w-0 rounded-2xl border border-border bg-background p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-primary/10",
                isCurrentUser && "border-accent/40 bg-accent/10",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl text-base font-extrabold shadow-sm tabular-nums",
                    getPositionTone(standing.position),
                  )}
                >
                  {standing.position}
                </span>
                <span className="inline-flex min-h-8 items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                  <Medal className="size-4" aria-hidden />
                  {getPositionLabel(standing.position)}
                </span>
              </div>

              <div className="mt-5 flex min-w-0 items-center gap-3">
                <UserAvatar name={standing.name} />
                <div className="min-w-0">
                  <p className="truncate text-base font-extrabold text-foreground">
                    {standing.name}
                  </p>
                  {isCurrentUser ? (
                    <p className="mt-1 text-xs font-bold uppercase tracking-wide text-accent">
                      Você
                    </p>
                  ) : null}
                </div>
              </div>

              <div className="mt-5 flex items-end justify-between gap-3 border-t border-border pt-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    Pontos
                  </p>
                  <p className="mt-1 text-3xl font-extrabold leading-none text-accent tabular-nums">
                    {standing.totalPoints}
                  </p>
                </div>
                <p className="text-right text-sm font-semibold leading-6 text-muted-foreground">
                  {formatExactScoresLabel(standing.exactScores)}<br />
                  {formatCorrectWinnersLabel(standing.correctWinners)}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-extrabold uppercase tracking-wide text-muted-foreground">
          Classificação geral
        </h3>

        <div className="overflow-hidden rounded-2xl border border-border bg-background">
          <div className="md:hidden">
            <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-3 border-b border-border bg-muted/60 px-4 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <span>Pos.</span>
              <span>Participante</span>
              <span className="text-right">Pontos</span>
            </div>
          {standings.map((standing) => (
            <RankingMobileRow
              key={standing.userId}
              standing={standing}
              isCurrentUser={standing.userId === currentUserId}
            />
          ))}
          </div>

          <div className="hidden overflow-x-auto md:block" tabIndex={0}>
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-muted/80 text-xs font-bold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th className="px-5 py-4 first:pl-6">Pos.</th>
                  <th className="px-5 py-4">Participante</th>
                  <th className="px-5 py-4 text-right">Pontos</th>
                  <th className="px-5 py-4 text-right">Exatos</th>
                  <th className="px-5 py-4 text-right">Vencedores</th>
                  <th className="px-5 py-4 text-right last:pr-6">Erros</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {standings.map((standing) => (
                  <RankingTableRow
                    key={standing.userId}
                    standing={standing}
                    isCurrentUser={standing.userId === currentUserId}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

type RankingRowProps = {
  standing: Standing;
  isCurrentUser: boolean;
};

function RankingTableRow({ standing, isCurrentUser }: RankingRowProps) {
  return (
    <tr
      className={cn(
        "transition hover:bg-muted/70",
        standing.position <= 3 && "bg-muted/35",
        isCurrentUser && "bg-accent/10 hover:bg-accent/10",
      )}
    >
      <td className="px-5 py-5 align-middle first:pl-6">
        <span
          className={cn(
            "inline-flex size-10 items-center justify-center rounded-xl text-sm font-extrabold shadow-sm tabular-nums",
            getPositionTone(standing.position),
          )}
        >
          {standing.position}
        </span>
      </td>
      <td className="px-5 py-5 align-middle">
        <div className="flex min-w-0 items-center gap-3">
          <UserAvatar name={standing.name} size="sm" />
          <div className="min-w-0">
            <p className="truncate text-base font-bold text-foreground">
              {standing.name}
            </p>
            <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {isCurrentUser ? "Você" : getPositionLabel(standing.position)}
            </p>
          </div>
        </div>
      </td>
      <td className="px-5 py-5 text-right align-middle text-xl font-extrabold text-accent tabular-nums">
        {standing.totalPoints}
      </td>
      <td className="px-5 py-5 text-right align-middle font-bold text-foreground tabular-nums">
        {standing.exactScores}
      </td>
      <td className="px-5 py-5 text-right align-middle font-bold text-foreground tabular-nums">
        {standing.correctWinners}
      </td>
      <td className="px-5 py-5 text-right align-middle font-bold text-muted-foreground tabular-nums last:pr-6">
        {standing.wrongPredictions}
      </td>
    </tr>
  );
}

function RankingMobileRow({ standing, isCurrentUser }: RankingRowProps) {
  return (
    <div
      className={cn(
        "grid min-h-14 grid-cols-[2.5rem_minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-3 last:border-b-0",
        standing.position <= 3 && "bg-muted/25",
        isCurrentUser && "bg-accent/10",
      )}
    >
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold tabular-nums",
          getPositionTone(standing.position),
        )}
      >
        {standing.position}
      </span>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-foreground">
          {standing.name}
        </p>
        {isCurrentUser ? (
          <p className="mt-0.5 text-xs font-bold uppercase tracking-wide text-accent">
            Você
          </p>
        ) : null}
      </div>
      <p className="text-right text-sm font-extrabold text-accent tabular-nums">
        {standing.totalPoints} pts
      </p>
    </div>
  );
}
