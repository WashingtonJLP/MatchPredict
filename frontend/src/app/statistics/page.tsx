"use client";

import {
  Activity,
  BarChart3,
  CircleX,
  Gauge,
  LineChart,
  Medal,
  Sparkles,
  Target,
  Trophy,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { LoadingCard } from "@/components/shared/loading-card";
import { PageHeader } from "@/components/shared/page-header";
import { TeamLogo } from "@/features/matches/components/team-logo";
import { useMyPredictions } from "@/hooks/use-predictions";
import { useMyStatistics } from "@/hooks/use-user";
import { cn } from "@/lib/utils";
import type { Prediction } from "@/types/prediction";
import type { RoundStatistics, UserStatistics } from "@/types/statistics";

type RoundPerformance = {
  correctWinnerOnly: number;
  exactScores: number;
  points: number;
  predictions: number;
  round: number;
  wrongPredictions: number;
};

type ChartPoint = RoundPerformance & {
  x: number;
  y: number;
};

type QualityMetric = {
  color: string;
  description: string;
  label: string;
  value: number;
};

type ChartDimensions = {
  height: number;
  padding: {
    bottom: number;
    left: number;
    right: number;
    top: number;
  };
  width: number;
};

const desktopChartDimensions: ChartDimensions = {
  height: 260,
  padding: {
    bottom: 38,
    left: 34,
    right: 28,
    top: 24,
  },
  width: 720,
};

const mobileChartDimensions: ChartDimensions = {
  height: 300,
  padding: {
    bottom: 44,
    left: 28,
    right: 18,
    top: 24,
  },
  width: 360,
};
const mobileRoundWindowSize = 5;
const desktopMaxRoundLabels = 8;

export default function StatisticsPage() {
  const statisticsQuery = useMyStatistics();
  const predictionsQuery = useMyPredictions();
  const statistics = statisticsQuery.data;
  const dashboard = useMemo(
    () => buildStatisticsDashboard(statistics, predictionsQuery.data ?? []),
    [predictionsQuery.data, statistics],
  );

  return (
    <DashboardShell>
      <div className="space-y-7 sm:space-y-9">
        <PageHeader
          title="Estatísticas"
          description="Leia sua temporada por pontos, aproveitamento, rodada e qualidade dos palpites."
        />

        {statisticsQuery.isLoading || predictionsQuery.isLoading ? (
          <StatisticsLoading />
        ) : statisticsQuery.isError || predictionsQuery.isError ? (
          <ErrorState
            icon={BarChart3}
            title="Estatísticas indisponíveis"
            description="Não foi possível carregar seus dados de desempenho agora."
          />
        ) : statistics && dashboard ? (
          <StatisticsExperience statistics={statistics} dashboard={dashboard} />
        ) : (
          <EmptyState
            icon={BarChart3}
            title="Sem estatísticas"
            description="Suas estatísticas aparecerão quando houver palpites na temporada ativa."
          />
        )}
      </div>
    </DashboardShell>
  );
}

function StatisticsLoading() {
  return (
    <div className="space-y-5">
      <LoadingCard rows={4} />
      <div className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
        <LoadingCard rows={6} />
        <LoadingCard rows={6} />
      </div>
    </div>
  );
}

function StatisticsExperience({
  dashboard,
  statistics,
}: {
  dashboard: ReturnType<typeof buildStatisticsDashboard>;
  statistics: UserStatistics;
}) {
  if (!dashboard) {
    return null;
  }

  return (
    <div className="space-y-6 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-3 motion-safe:duration-500 sm:space-y-7">
      <SeasonScoreboard dashboard={dashboard} statistics={statistics} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
        <RoundEvolutionChart rounds={dashboard.rounds} />
        <PredictionQualityPanel dashboard={dashboard} statistics={statistics} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)]">
        <SeasonHighlights
          bestRound={statistics.bestRound}
          worstRound={statistics.worstRound}
          processedCount={dashboard.processedCount}
          recentAverage={dashboard.recentAverage}
        />
        <RecentForm predictions={dashboard.recentPredictions} />
      </div>
    </div>
  );
}

function SeasonScoreboard({
  dashboard,
  statistics,
}: {
  dashboard: StatisticsDashboard;
  statistics: UserStatistics;
}) {
  return (
    <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
      <div className="grid gap-0 lg:grid-cols-[minmax(0,1.05fr)_minmax(20rem,0.95fr)]">
        <div className="relative min-w-0 p-5 sm:p-7 lg:p-8">
          <div className="absolute inset-x-6 top-0 h-px bg-primary-foreground/20" />
          <p className="inline-flex min-h-8 items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
            <Activity className="size-4" aria-hidden />
            Boletim da temporada
          </p>
          <div className="mt-7 grid gap-6 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary-foreground/65">
                Total de pontos
              </p>
              <p className="mt-2 flex flex-wrap items-end gap-x-3 gap-y-1">
                <span className="text-6xl font-black leading-none tracking-tight text-primary-foreground sm:text-7xl lg:text-8xl">
                  {formatNumber(statistics.totalPoints)}
                </span>
                <span className="pb-2 text-xl font-extrabold text-accent sm:text-2xl">
                  pts
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/10 px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/65">
                Posição atual
              </p>
              <p className="mt-2 text-4xl font-black leading-none tabular-nums">
                {statistics.currentPosition
                  ? `#${statistics.currentPosition}`
                  : "-"}
              </p>
            </div>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-3">
            <ScoreboardFact
              label="Aproveitamento"
              value={`${formatNumber(statistics.accuracy)}%`}
              description="Palpites avaliados com vencedor correto"
            />
            <ScoreboardFact
              label="Média"
              value={formatPoints(statistics.averagePoints)}
              description="Por palpite avaliado"
            />
            <ScoreboardFact
              label="Avaliados"
              value={`${dashboard.processedCount}/${statistics.totalPredictions}`}
              description={`${dashboard.pendingCount} pendentes`}
            />
          </div>
        </div>

        <div className="border-t border-primary-foreground/10 bg-primary-foreground/[0.04] p-5 sm:p-7 lg:border-l lg:border-t-0 lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-primary-foreground/65">
                Palpites
              </p>
              <h2 className="mt-1 text-2xl font-extrabold">
                Avaliados x pendentes
              </h2>
            </div>
            <Gauge className="size-8 text-accent" aria-hidden />
          </div>

          <div className="mt-6">
            <div className="h-4 overflow-hidden rounded-full bg-primary-foreground/10">
              <div
                className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
                style={{ width: `${dashboard.processedRatio}%` }}
              />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <CompactCount
                label="Avaliados"
                value={dashboard.processedCount}
                tone="accent"
              />
              <CompactCount label="Pendentes" value={dashboard.pendingCount} />
            </div>
            <p className="mt-5 text-sm font-medium leading-6 text-primary-foreground/70">
              A média e o aproveitamento usam apenas palpites de partidas já
              avaliadas. Palpites pendentes seguem no total da temporada.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScoreboardFact({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-primary-foreground/12 bg-primary-foreground/8 px-4 py-3">
      <p className="text-xs font-bold uppercase tracking-wide text-primary-foreground/60">
        {label}
      </p>
      <p className="mt-2 text-2xl font-black leading-none tabular-nums">
        {value}
      </p>
      <p className="mt-2 text-xs font-semibold leading-5 text-primary-foreground/65">
        {description}
      </p>
    </div>
  );
}

function CompactCount({
  label,
  tone = "muted",
  value,
}: {
  label: string;
  tone?: "accent" | "muted";
  value: number;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3",
        tone === "accent"
          ? "bg-accent text-accent-foreground"
          : "bg-primary-foreground/10 text-primary-foreground",
      )}
    >
      <p className="text-xs font-bold uppercase tracking-wide opacity-70">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black leading-none tabular-nums">
        {value}
      </p>
    </div>
  );
}

function RoundEvolutionChart({ rounds }: { rounds: RoundPerformance[] }) {
  const [activeRound, setActiveRound] = useState<number | null>(
    rounds[rounds.length - 1]?.round ?? null,
  );
  const activeRoundIndexCandidate = rounds.findIndex(
    (round) => round.round === activeRound,
  );
  const activeRoundIndex =
    activeRoundIndexCandidate >= 0
      ? activeRoundIndexCandidate
      : Math.max(rounds.length - 1, 0);
  const selectedRound = rounds[activeRoundIndex] ?? null;
  const mobileWindowStart = getRoundWindowStart(
    activeRoundIndex,
    rounds.length,
  );
  const mobileRounds = useMemo(
    () =>
      rounds.slice(
        mobileWindowStart,
        mobileWindowStart + mobileRoundWindowSize,
      ),
    [mobileWindowStart, rounds],
  );
  const mobileRangeStart = mobileRounds[0]?.round ?? null;
  const mobileRangeEnd = mobileRounds[mobileRounds.length - 1]?.round ?? null;
  const desktopRounds = useMemo(
    () => (selectedRound ? rounds.slice(0, activeRoundIndex + 1) : rounds),
    [activeRoundIndex, rounds, selectedRound],
  );
  const desktopChart = useMemo(
    () => buildChart(desktopRounds, desktopChartDimensions),
    [desktopRounds],
  );
  const mobileChart = useMemo(
    () => buildChart(mobileRounds, mobileChartDimensions),
    [mobileRounds],
  );
  const desktopLabelRounds = useMemo(
    () => getDesktopLabelRounds(desktopRounds),
    [desktopRounds],
  );
  const mobileLabelRounds = useMemo(
    () => new Set(mobileRounds.map((round) => round.round)),
    [mobileRounds],
  );
  const activePoint =
    desktopChart.points.find((point) => point.round === activeRound) ??
    desktopChart.points[desktopChart.points.length - 1] ??
    null;

  useEffect(() => {
    if (rounds.length === 0) {
      setActiveRound(null);
      return;
    }

    if (!rounds.some((round) => round.round === activeRound)) {
      setActiveRound(rounds[rounds.length - 1].round);
    }
  }, [activeRound, rounds]);

  function selectRound(round: number) {
    setActiveRound(round);
  }

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-accent">
            Evolução por rodada
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-card-foreground sm:text-3xl">
            Pontos rodada a rodada
          </h2>
        </div>
        {selectedRound ? (
          <div className="grid gap-3 rounded-2xl bg-muted px-4 py-3 sm:min-w-72 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label
              htmlFor="round-selector"
              className="text-xs font-bold uppercase tracking-wide text-muted-foreground"
            >
              Rodada
            </label>
            <select
              id="round-selector"
              value={selectedRound.round}
              onChange={(event) => selectRound(Number(event.target.value))}
              className="min-h-11 rounded-xl border border-border bg-background px-3 text-base font-extrabold text-foreground shadow-sm outline-none transition focus:border-accent focus:ring-3 focus:ring-ring/50"
            >
              {rounds.map((round) => (
                <option key={round.round} value={round.round}>
                  Rodada {round.round}
                </option>
              ))}
            </select>
            <p className="text-2xl font-black text-foreground tabular-nums sm:text-right">
              R{selectedRound.round} · {formatPoints(selectedRound.points)}
            </p>
          </div>
        ) : null}
      </div>

      {rounds.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <LineChart className="mx-auto size-10 text-muted-foreground" aria-hidden />
          <p className="mt-4 text-lg font-extrabold text-foreground">
            Nenhuma rodada avaliada ainda
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            O gráfico aparece quando suas partidas finalizadas forem processadas.
          </p>
        </div>
      ) : (
        <>
          <div className="-mx-1 mt-6 overflow-hidden rounded-2xl bg-muted/45 p-1.5 sm:mx-0 sm:p-4">
            <ChartSvg
              activeRound={activePoint?.round ?? null}
              chart={mobileChart}
              className="h-80 w-full sm:hidden"
              dimensions={mobileChartDimensions}
              labelRounds={mobileLabelRounds}
              onSelectRound={selectRound}
            />
            <ChartSvg
              activeRound={activePoint?.round ?? null}
              chart={desktopChart}
              className="hidden h-72 w-full sm:block"
              dimensions={desktopChartDimensions}
              labelRounds={desktopLabelRounds}
              onSelectRound={selectRound}
            />
          </div>

          <div className="mt-4 flex items-center justify-center sm:hidden">
            <p className="text-center text-xs font-bold uppercase tracking-wide text-muted-foreground">
              {mobileRangeStart && mobileRangeEnd
                ? mobileRangeStart === mobileRangeEnd
                  ? `R${mobileRangeStart}`
                  : `R${mobileRangeStart} - R${mobileRangeEnd}`
                : "Sem rodadas"}
            </p>
          </div>

          <div className="mt-4 hidden items-center justify-between rounded-2xl bg-muted/45 px-4 py-3 sm:flex">
            <p className="text-sm font-semibold text-muted-foreground">
              Histórico exibido até a rodada selecionada.
            </p>
            <p className="text-sm font-black text-foreground tabular-nums">
              {rounds.length} {rounds.length === 1 ? "rodada" : "rodadas"}
            </p>
          </div>

          <ul className="sr-only" aria-label="Resumo das rodadas com dados">
            {rounds.map((round) => (
              <li key={round.round}>
                Rodada {round.round}: {formatPoints(round.points)}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function ChartSvg({
  activeRound,
  chart,
  className,
  dimensions,
  labelRounds,
  onSelectRound,
}: {
  activeRound: number | null;
  chart: ReturnType<typeof buildChart>;
  className: string;
  dimensions: ChartDimensions;
  labelRounds: Set<number>;
  onSelectRound: (round: number) => void;
}) {
  const { height, padding, width } = dimensions;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label="Gráfico de pontos obtidos por rodada"
      className={cn("touch-manipulation", className)}
    >
      <line
        x1={padding.left}
        x2={width - padding.right}
        y1={height - padding.bottom}
        y2={height - padding.bottom}
        className="stroke-border"
        strokeWidth="2"
      />
      {chart.gridLines.map((line) => (
        <g key={line.value}>
          <line
            x1={padding.left}
            x2={width - padding.right}
            y1={line.y}
            y2={line.y}
            className="stroke-border/70"
            strokeDasharray="4 8"
          />
          <text
            x={padding.left - 10}
            y={line.y + 4}
            textAnchor="end"
            className="fill-muted-foreground text-xs font-bold"
          >
            {line.value}
          </text>
        </g>
      ))}
      {chart.areaPath ? (
        <path d={chart.areaPath} className="fill-accent/10" />
      ) : null}
      {chart.linePath ? (
        <path
          d={chart.linePath}
          className="fill-none stroke-accent"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="5"
        />
      ) : null}
      {chart.points.map((point) => {
        const isActive = point.round === activeRound;
        const activeLabelX = Math.min(Math.max(point.x, 46), width - 46);
        const activeLabelY = Math.max(point.y - 44, 8);

        return (
          <g key={point.round}>
            <line
              x1={point.x}
              x2={point.x}
              y1={point.y}
              y2={height - padding.bottom}
              className={cn("stroke-border", isActive && "stroke-accent/50")}
              strokeDasharray="3 7"
            />
            <g
              role="button"
              tabIndex={0}
              aria-pressed={isActive}
              aria-label={`Rodada ${point.round}: ${formatPoints(point.points)}`}
              onClick={() => onSelectRound(point.round)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectRound(point.round);
                }
              }}
              onMouseEnter={() => onSelectRound(point.round)}
              className="cursor-pointer focus:outline-none"
            >
              <circle
                cx={point.x}
                cy={point.y}
                r={isActive ? 10 : 7}
                className={cn(
                  "fill-card stroke-accent transition-all duration-200",
                  isActive && "fill-accent stroke-accent",
                )}
                strokeWidth="4"
              />
            </g>
            {isActive ? (
              <g aria-hidden transform={`translate(${activeLabelX - 38} ${activeLabelY})`}>
                <rect
                  width="76"
                  height="34"
                  rx="10"
                  className="fill-primary"
                />
                <text
                  x="38"
                  y="14"
                  textAnchor="middle"
                  className="fill-primary-foreground text-xs font-black"
                >
                  R{point.round}
                </text>
                <text
                  x="38"
                  y="28"
                  textAnchor="middle"
                  className="fill-accent text-xs font-black"
                >
                  {formatPoints(point.points)}
                </text>
              </g>
            ) : null}
            {labelRounds.has(point.round) ? (
              <text
                x={point.x}
                y={height - 10}
                textAnchor="middle"
                className="fill-muted-foreground text-xs font-black"
              >
                R{point.round}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function PredictionQualityPanel({
  dashboard,
  statistics,
}: {
  dashboard: StatisticsDashboard;
  statistics: UserStatistics;
}) {
  const qualityMetrics: QualityMetric[] = [
    {
      color: "bg-accent",
      description: "3 pts cada",
      label: "Placares exatos",
      value: statistics.exactScores,
    },
    {
      color: "bg-primary",
      description: "1 pt cada, sem placar exato",
      label: "Vencedores corretos",
      value: dashboard.correctWinnerOnly,
    },
    {
      color: "bg-destructive",
      description: "0 pts",
      label: "Erros",
      value: statistics.wrongPredictions,
    },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-accent">
            Qualidade dos palpites
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-card-foreground">
            Como seus pontos nasceram
          </h2>
        </div>
        <Target className="size-8 shrink-0 text-accent" aria-hidden />
      </div>

      <div className="mt-6 rounded-2xl bg-muted/45 p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
              Aproveitamento
            </p>
            <p className="mt-1 text-5xl font-black leading-none text-foreground tabular-nums">
              {formatNumber(statistics.accuracy)}
              <span className="text-2xl text-accent">%</span>
            </p>
          </div>
          <p className="max-w-36 text-right text-xs font-semibold leading-5 text-muted-foreground">
            Percentual de palpites avaliados com vencedor correto.
          </p>
        </div>
        <div className="mt-4 h-3 overflow-hidden rounded-full bg-background">
          <div
            className="h-full rounded-full bg-accent transition-[width] duration-700 ease-out motion-reduce:transition-none"
            style={{ width: `${Math.min(statistics.accuracy, 100)}%` }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {qualityMetrics.map((metric) => (
          <QualityRow
            key={metric.label}
            metric={metric}
            total={Math.max(dashboard.processedCount, 1)}
          />
        ))}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
          Pontos construídos
        </p>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <PointSource
            label="Placares"
            value={dashboard.exactScorePoints}
            description={`${statistics.exactScores} x 3 pts`}
          />
          <PointSource
            label="Vencedores"
            value={dashboard.correctWinnerOnlyPoints}
            description={`${dashboard.correctWinnerOnly} x 1 pt`}
          />
        </div>
      </div>
    </section>
  );
}

function QualityRow({
  metric,
  total,
}: {
  metric: QualityMetric;
  total: number;
}) {
  const ratio = Math.min((metric.value / total) * 100, 100);

  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-extrabold text-foreground">
            {metric.label}
          </p>
          <p className="mt-0.5 text-xs font-semibold text-muted-foreground">
            {metric.description}
          </p>
        </div>
        <p className="text-2xl font-black text-foreground tabular-nums">
          {metric.value}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-[width] duration-700 ease-out motion-reduce:transition-none",
            metric.color,
          )}
          style={{ width: `${ratio}%` }}
        />
      </div>
    </div>
  );
}

function PointSource({
  description,
  label,
  value,
}: {
  description: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl bg-background px-4 py-3 ring-1 ring-border">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-3xl font-black leading-none text-foreground tabular-nums">
        {formatPoints(value)}
      </p>
      <p className="mt-2 text-xs font-semibold text-muted-foreground">
        {description}
      </p>
    </div>
  );
}

function SeasonHighlights({
  bestRound,
  processedCount,
  recentAverage,
  worstRound,
}: {
  bestRound: RoundStatistics | null;
  processedCount: number;
  recentAverage: number;
  worstRound: RoundStatistics | null;
}) {
  const showWorstRound =
    processedCount > 1 && worstRound && bestRound?.round !== worstRound.round;

  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
          <Medal className="size-5" aria-hidden />
        </span>
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-accent">
            Destaques
          </p>
          <h2 className="text-2xl font-extrabold text-card-foreground">
            Momentos da temporada
          </h2>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <HighlightStrip
          icon={Sparkles}
          label="Melhor rodada"
          value={bestRound ? `Rodada ${bestRound.round}` : "Aguardando"}
          detail={
            bestRound
              ? formatPoints(bestRound.points)
              : "Nenhuma rodada avaliada ainda"
          }
          strong
        />
        <HighlightStrip
          icon={Activity}
          label="Forma recente"
          value={formatPoints(recentAverage)}
          detail="Média nos últimos palpites avaliados"
        />
        {showWorstRound ? (
          <HighlightStrip
            icon={CircleX}
            label="Rodada de atenção"
            value={`Rodada ${worstRound.round}`}
            detail={`${formatPoints(worstRound.points)} nos jogos avaliados`}
          />
        ) : (
          <div className="rounded-2xl bg-muted/45 px-4 py-3 text-sm font-semibold leading-6 text-muted-foreground">
            A pior rodada fica em segundo plano até existirem rodadas avaliadas
            suficientes para comparação.
          </div>
        )}
      </div>
    </section>
  );
}

function HighlightStrip({
  detail,
  icon: Icon,
  label,
  strong = false,
  value,
}: {
  detail: string;
  icon: typeof Trophy;
  label: string;
  strong?: boolean;
  value: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-2xl px-4 py-3 ring-1 ring-border",
        strong ? "bg-primary text-primary-foreground" : "bg-background",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Icon
          className={cn(
            "size-5 shrink-0",
            strong ? "text-accent" : "text-muted-foreground",
          )}
          aria-hidden
        />
        <div className="min-w-0">
          <p
            className={cn(
              "text-xs font-bold uppercase tracking-wide",
              strong ? "text-primary-foreground/65" : "text-muted-foreground",
            )}
          >
            {label}
          </p>
          <p className="truncate text-lg font-black">{value}</p>
        </div>
      </div>
      <p
        className={cn(
          "max-w-32 text-right text-xs font-semibold leading-5",
          strong ? "text-primary-foreground/70" : "text-muted-foreground",
        )}
      >
        {detail}
      </p>
    </div>
  );
}

function RecentForm({ predictions }: { predictions: Prediction[] }) {
  return (
    <section className="rounded-2xl border border-border bg-card p-4 shadow-sm shadow-primary/5 sm:p-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-accent">
            Desempenho recente
          </p>
          <h2 className="mt-2 text-2xl font-extrabold text-card-foreground">
            Últimos palpites avaliados
          </h2>
        </div>
        <p className="text-sm font-semibold text-muted-foreground">
          Até 5 jogos processados
        </p>
      </div>

      {predictions.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-border bg-muted/40 p-6 text-center">
          <p className="text-base font-bold text-foreground">
            Nenhum palpite avaliado ainda
          </p>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            Quando as partidas forem processadas, seu recorte recente aparece
            aqui.
          </p>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-background">
          {predictions.map((prediction) => (
            <RecentPredictionRow
              key={prediction.id}
              prediction={prediction}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function RecentPredictionRow({ prediction }: { prediction: Prediction }) {
  const { awayTeam, homeTeam } = prediction.fixture;

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-3 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_5rem_5rem] sm:px-4">
      <div className="min-w-0">
        <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 sm:flex sm:gap-3">
          <RecentTeam team={homeTeam} />
          <span className="text-xs font-black uppercase text-muted-foreground">
            x
          </span>
          <RecentTeam team={awayTeam} />
        </div>
        <p className="mt-2 text-xs font-bold uppercase tracking-wide text-muted-foreground sm:mt-1">
          Rodada {prediction.fixture.round}
          <span className="sm:hidden">
            {" "}
            · Palpite {prediction.homeGoals} x {prediction.awayGoals}
          </span>
        </p>
      </div>
      <p className="hidden text-center text-base font-black text-foreground tabular-nums sm:block">
        {prediction.homeGoals} x {prediction.awayGoals}
      </p>
      <p className="text-right text-lg font-black text-accent tabular-nums">
        {formatPoints(prediction.totalPoints)}
      </p>
    </div>
  );
}

function RecentTeam({
  team,
}: {
  team: Prediction["fixture"]["homeTeam"];
}) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <TeamLogo team={team} size="sm" />
      <span className="truncate text-sm font-extrabold text-foreground">
        {team.name}
      </span>
    </div>
  );
}

type StatisticsDashboard = {
  correctWinnerOnly: number;
  correctWinnerOnlyPoints: number;
  exactScorePoints: number;
  pendingCount: number;
  processedCount: number;
  processedRatio: number;
  recentAverage: number;
  recentPredictions: Prediction[];
  rounds: RoundPerformance[];
};

function buildStatisticsDashboard(
  statistics: UserStatistics | undefined,
  predictions: Prediction[],
): StatisticsDashboard | null {
  if (!statistics) {
    return null;
  }

  const processedPredictions = predictions.filter(
    (prediction) => prediction.fixture.processedAt !== null,
  );
  const pendingCount = Math.max(
    statistics.totalPredictions - processedPredictions.length,
    0,
  );
  const roundMap = new Map<number, RoundPerformance>();

  for (const prediction of processedPredictions) {
    const round = prediction.fixture.round;
    const current = roundMap.get(round) ?? {
      correctWinnerOnly: 0,
      exactScores: 0,
      points: 0,
      predictions: 0,
      round,
      wrongPredictions: 0,
    };

    roundMap.set(round, {
      correctWinnerOnly:
        current.correctWinnerOnly +
        Number(prediction.correctWinner && !prediction.exactScore),
      exactScores: current.exactScores + Number(prediction.exactScore),
      points: current.points + prediction.totalPoints,
      predictions: current.predictions + 1,
      round,
      wrongPredictions:
        current.wrongPredictions + Number(!prediction.correctWinner),
    });
  }

  const recentPredictions = [...processedPredictions]
    .sort(
      (first, second) =>
        new Date(second.fixture.kickoff).getTime() -
        new Date(first.fixture.kickoff).getTime(),
    )
    .slice(0, 5);
  const recentAverage =
    recentPredictions.length === 0
      ? 0
      : roundToTwoDecimals(
          recentPredictions.reduce(
            (total, prediction) => total + prediction.totalPoints,
            0,
          ) / recentPredictions.length,
        );
  const correctWinnerOnly = Math.max(
    statistics.correctWinners - statistics.exactScores,
    0,
  );

  return {
    correctWinnerOnly,
    correctWinnerOnlyPoints: correctWinnerOnly,
    exactScorePoints: statistics.exactScores * 3,
    pendingCount,
    processedCount: processedPredictions.length,
    processedRatio:
      statistics.totalPredictions === 0
        ? 0
        : Math.round(
            (processedPredictions.length / statistics.totalPredictions) * 100,
          ),
    recentAverage,
    recentPredictions,
    rounds: [...roundMap.values()].sort(
      (first, second) => first.round - second.round,
    ),
  };
}

function buildChart(rounds: RoundPerformance[], dimensions: ChartDimensions) {
  const { height, padding, width } = dimensions;
  const maxPoints = Math.max(...rounds.map((round) => round.points), 1);
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const points: ChartPoint[] = rounds.map((round, index) => {
    const x =
      rounds.length === 1
        ? padding.left + plotWidth / 2
        : padding.left + (plotWidth / (rounds.length - 1)) * index;
    const y =
      padding.top + plotHeight - (round.points / maxPoints) * plotHeight;

    return {
      ...round,
      x,
      y,
    };
  });
  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");
  const areaPath =
    points.length === 0
      ? ""
      : `${linePath} L ${points[points.length - 1].x} ${
          height - padding.bottom
        } L ${points[0].x} ${height - padding.bottom} Z`;
  const gridLines = [0, Math.ceil(maxPoints / 2), maxPoints].map((value) => ({
    value,
    y: padding.top + plotHeight - (value / maxPoints) * plotHeight,
  }));

  return {
    areaPath,
    gridLines,
    linePath,
    points,
  };
}

function getLatestRoundWindowStart(totalRounds: number) {
  return Math.max(totalRounds - mobileRoundWindowSize, 0);
}

function getRoundWindowStart(roundIndex: number, totalRounds: number) {
  const latestWindowStart = getLatestRoundWindowStart(totalRounds);

  return Math.min(
    Math.max(roundIndex - mobileRoundWindowSize + 1, 0),
    latestWindowStart,
  );
}

function getDesktopLabelRounds(rounds: RoundPerformance[]) {
  const labelRounds = new Set<number>();

  if (rounds.length === 0) {
    return labelRounds;
  }

  const step = Math.max(
    Math.ceil((rounds.length - 1) / (desktopMaxRoundLabels - 1)),
    1,
  );

  for (let index = 0; index < rounds.length; index += step) {
    labelRounds.add(rounds[index].round);
  }

  labelRounds.add(rounds[rounds.length - 1].round);

  return labelRounds;
}

function formatPoints(points: number) {
  return `${formatNumber(points)} ${points === 1 ? "pt" : "pts"}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 2,
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
  }).format(value);
}

function roundToTwoDecimals(value: number) {
  return Number(value.toFixed(2));
}
