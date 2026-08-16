"use client";

import {
  BookOpen,
  CalendarDays,
  Gauge,
  Hash,
  Target,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { DataTable } from "@/components/shared/data-table";
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

  return (
    <DashboardShell>
      <div className="space-y-9">
        <PageHeader
          title="Dashboard"
          description="Acompanhe seu perfil e a classificacao geral da temporada ativa."
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
            title="Nao foi possivel carregar seu painel"
            description="Tente recarregar a pagina ou entrar novamente."
          />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              icon={Trophy}
              title="Sua posicao"
              value={
                statistics?.currentPosition
                  ? `#${statistics.currentPosition}`
                  : "-"
              }
              description={`${user?.name ?? "Usuario"}, esta e sua posicao atual no ranking.`}
            />
            <StatCard
              icon={Target}
              title="Seus pontos"
              value={statistics?.totalPoints ?? 0}
              description="Pontuacao acumulada na temporada ativa."
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
            title="Proximos palpites"
            description="Acesse rapidamente as proximas partidas para registrar ou ajustar seus palpites."
          />

          {fixturesQuery.isLoading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <LoadingCard key={index} rows={4} />
              ))}
            </div>
          ) : fixturesQuery.isError ? (
            <ErrorState
              icon={CalendarDays}
              title="Proximas partidas indisponiveis"
              description="Nao foi possivel carregar os proximos palpites agora."
            />
          ) : !fixturesQuery.data?.data.length ? (
            <EmptyState
              icon={CalendarDays}
              title="Sem proximas partidas"
              description="Novas partidas aparecerao aqui quando forem sincronizadas."
            />
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
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

        <section id="ranking" className="space-y-5">
          <SectionTitle
            eyebrow="Ranking"
            title="Classificacao geral"
            description="Tabela responsiva com pontos, acertos e erros da temporada ativa."
          />

          {standingsQuery.isLoading ? (
            <LoadingCard rows={6} />
          ) : standingsQuery.isError ? (
            <ErrorState
              icon={Trophy}
              title="Ranking indisponivel"
              description="Nao foi possivel carregar a classificacao agora."
            />
          ) : !standingsQuery.data?.length ? (
            <EmptyState
              icon={Trophy}
              title="Sem dados de ranking"
              description="O ranking aparecera quando houver standings processados."
            />
          ) : (
            <DataTable<Standing>
              data={standingsQuery.data}
              getRowKey={(item) => item.userId}
              rowClassName={(item) =>
                item.userId === authUser?.id
                  ? "bg-accent/10 hover:bg-accent/10"
                  : "hover:bg-muted"
              }
              columns={[
                {
                  key: "position",
                  header: "Posicao",
                  render: (item) => (
                    <span className="font-semibold text-foreground">
                      #{item.position}
                    </span>
                  ),
                },
                {
                  key: "user",
                  header: "Usuario",
                  render: (item) => (
                    <div className="flex items-center gap-3">
                      <UserAvatar name={item.name} size="sm" />
                      <span className="font-medium text-foreground">
                        {item.name}
                      </span>
                    </div>
                  ),
                },
                {
                  key: "points",
                  header: "Pontos",
                  render: (item) => (
                    <span className="font-semibold text-accent">
                      {item.totalPoints}
                    </span>
                  ),
                },
                {
                  key: "exact",
                  header: "Placares exatos",
                  render: (item) => item.exactScores,
                },
                {
                  key: "winners",
                  header: "Acertos",
                  render: (item) => item.correctWinners,
                },
                {
                  key: "wrong",
                  header: "Erros",
                  render: (item) => item.wrongPredictions,
                },
              ]}
            />
          )}
        </section>

        <PredictionModal
          fixture={selectedFixture}
          onClose={() => setSelectedFixture(null)}
        />
      </div>
    </DashboardShell>
  );
}
