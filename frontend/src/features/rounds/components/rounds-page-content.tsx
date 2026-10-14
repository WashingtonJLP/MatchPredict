"use client";

import {
  Award,
  CalendarRange,
  CheckCircle2,
  ChevronDown,
  CircleAlert,
  CircleX,
  Clock3,
  Crown,
  Medal,
  RefreshCw,
  ShieldAlert,
  Target,
  UsersRound,
} from "lucide-react";
import { useEffect, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { ErrorState } from "@/components/shared/error-state";
import { PageHeader } from "@/components/shared/page-header";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import {
  formatHighlightNames,
  getBestHighlightCaption,
  getRoundContentState,
  getRoundStatusCopy,
  getRoundsCatalogState,
} from "@/features/rounds/rounds-view";
import { useRoundStats, useRoundsCatalog } from "@/hooks/use-rounds";
import { cn } from "@/lib/utils";
import type {
  RoundBestHighlightParticipant,
  RoundCatalogCompetition,
  RoundCatalogSeason,
  RoundHighlightParticipant,
  RoundParticipant,
  RoundSelection,
  RoundStats,
} from "@/types/round";

export function RoundsPageContent() {
  const catalogQuery = useRoundsCatalog();
  const [selection, setSelection] = useState<RoundSelection | null>(null);

  useEffect(() => {
    const defaults = catalogQuery.data?.defaults;

    if (
      !selection &&
      defaults?.competitionId &&
      defaults.seasonId &&
      defaults.round
    ) {
      setSelection({
        competitionId: defaults.competitionId,
        seasonId: defaults.seasonId,
        round: defaults.round,
      });
    }
  }, [catalogQuery.data?.defaults, selection]);

  const statsQuery = useRoundStats(selection);
  const competitions = catalogQuery.data?.competitions ?? [];
  const catalogState = getRoundsCatalogState({
    competitionCount: competitions.length,
    isError: catalogQuery.isError,
    isLoading: catalogQuery.isLoading,
  });
  const selectedCompetition =
    competitions.find(
      (competition) => competition.id === selection?.competitionId,
    ) ?? null;
  const selectedSeason =
    selectedCompetition?.seasons.find(
      (season) => season.id === selection?.seasonId,
    ) ?? null;

  function selectCompetition(competitionId: string) {
    const competition = competitions.find(
      (candidate) => candidate.id === competitionId,
    );
    const season = pickSeason(competition);

    if (!competition || !season || season.defaultRound === null) {
      setSelection(null);
      return;
    }

    setSelection({
      competitionId: competition.id,
      seasonId: season.id,
      round: season.defaultRound,
    });
  }

  function selectSeason(seasonId: string) {
    const season = selectedCompetition?.seasons.find(
      (candidate) => candidate.id === seasonId,
    );

    if (!selectedCompetition || !season || season.defaultRound === null) {
      return;
    }

    setSelection({
      competitionId: selectedCompetition.id,
      seasonId: season.id,
      round: season.defaultRound,
    });
  }

  return (
    <div className="space-y-7 sm:space-y-9">
      <PageHeader
        title="Rodadas"
        description="Acompanhe quem se destacou em cada rodada e compare seu desempenho usando apenas os pontos conquistados nos palpites."
      />

      {catalogState === "LOADING" ? (
        <RoundsLoading />
      ) : catalogState === "ERROR" ? (
        <ErrorState
          icon={CalendarRange}
          title="Rodadas indisponíveis"
          description="Não foi possível carregar competições e temporadas. Tente novamente em instantes."
        />
      ) : catalogState === "EMPTY" ? (
        <EmptyState
          icon={CalendarRange}
          title="Nenhuma rodada disponível"
          description="As rodadas aparecerão quando houver partidas sincronizadas para uma temporada."
        />
      ) : (
        <>
          <RoundFilters
            competitions={competitions}
            selectedCompetition={selectedCompetition}
            selectedSeason={selectedSeason}
            selection={selection}
            onCompetitionChange={selectCompetition}
            onSeasonChange={selectSeason}
            onRoundChange={(round) =>
              setSelection((current) =>
                current ? { ...current, round } : current,
              )
            }
          />

          {!selection || statsQuery.isLoading ? (
            <RoundsStatsLoading />
          ) : statsQuery.isError ? (
            <div className="space-y-4">
              <ErrorState
                icon={ShieldAlert}
                title="Estatísticas indisponíveis"
                description="Não foi possível calcular esta rodada agora. Os dados não foram alterados."
              />
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  className="min-h-11 rounded-xl"
                  onClick={() => void statsQuery.refetch()}
                >
                  <RefreshCw className="size-4" aria-hidden />
                  Tentar novamente
                </Button>
              </div>
            </div>
          ) : statsQuery.data ? (
            <RoundExperience stats={statsQuery.data} />
          ) : null}
        </>
      )}
    </div>
  );
}

function RoundFilters({
  competitions,
  selectedCompetition,
  selectedSeason,
  selection,
  onCompetitionChange,
  onSeasonChange,
  onRoundChange,
}: {
  competitions: RoundCatalogCompetition[];
  selectedCompetition: RoundCatalogCompetition | null;
  selectedSeason: RoundCatalogSeason | null;
  selection: RoundSelection | null;
  onCompetitionChange: (competitionId: string) => void;
  onSeasonChange: (seasonId: string) => void;
  onRoundChange: (round: number) => void;
}) {
  return (
    <section
      className="rounded-2xl border border-border bg-card p-4 sm:p-6"
      aria-label="Selecionar rodada"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <RoundSelect
          id="round-competition"
          label="Competição"
          value={selection?.competitionId ?? ""}
          disabled={competitions.length <= 1}
          onChange={onCompetitionChange}
        >
          {competitions.map((competition) => (
            <option key={competition.id} value={competition.id}>
              {competition.name}
            </option>
          ))}
        </RoundSelect>

        <RoundSelect
          id="round-season"
          label="Temporada"
          value={selection?.seasonId ?? ""}
          disabled={(selectedCompetition?.seasons.length ?? 0) <= 1}
          onChange={onSeasonChange}
        >
          {selectedCompetition?.seasons.map((season) => (
            <option key={season.id} value={season.id}>
              {season.name}
            </option>
          ))}
        </RoundSelect>

        <RoundSelect
          id="round-number"
          label="Rodada"
          value={selection?.round ? String(selection.round) : ""}
          disabled={(selectedSeason?.rounds.length ?? 0) <= 1}
          onChange={(value) => onRoundChange(Number(value))}
        >
          {selectedSeason?.rounds.map((round) => (
            <option key={round.number} value={round.number}>
              Rodada {round.number}
            </option>
          ))}
        </RoundSelect>
      </div>
    </section>
  );
}

function RoundSelect({
  children,
  disabled,
  id,
  label,
  onChange,
  value,
}: {
  children: React.ReactNode;
  disabled: boolean;
  id: string;
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label htmlFor={id} className="block min-w-0">
      <span className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </span>
      <span className="relative mt-2 block">
        <select
          id={id}
          value={value}
          disabled={disabled}
          className="min-h-12 w-full appearance-none rounded-xl border border-input bg-background px-4 pr-11 font-navigation text-base font-bold text-foreground transition hover:border-accent/50 focus:border-accent focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground"
          onChange={(event) => onChange(event.target.value)}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
      </span>
    </label>
  );
}

function RoundExperience({ stats }: { stats: RoundStats }) {
  const contentState = getRoundContentState(stats);

  return (
    <div className="space-y-7 motion-safe:animate-in motion-safe:fade-in motion-safe:slide-in-from-bottom-2 motion-safe:duration-500 sm:space-y-9">
      <RoundSummary stats={stats} />

      {stats.dataIncomplete ? (
        <div
          className="flex items-start gap-3 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100"
          role="status"
        >
          <CircleAlert className="mt-0.5 size-5 shrink-0" aria-hidden />
          <p className="text-sm font-semibold leading-6">
            Há jogos encerrados com dados ainda incompletos ou aguardando
            processamento. A rodada não será tratada como consolidada.
          </p>
        </div>
      ) : null}

      <RoundHighlights stats={stats} contentState={contentState} />
      <MyRoundPerformance stats={stats} />
      <RoundRanking stats={stats} contentState={contentState} />
    </div>
  );
}

function RoundSummary({ stats }: { stats: RoundStats }) {
  const statusCopy = getRoundStatusCopy(stats);
  const completion = stats.totalFixtures
    ? Math.round((stats.completedFixtures / stats.totalFixtures) * 100)
    : 0;

  return (
    <section className="overflow-hidden rounded-2xl bg-primary text-primary-foreground shadow-xl shadow-primary/20">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-stretch">
        <div className="p-5 sm:p-7 lg:p-8">
          <div className="flex flex-wrap items-center gap-3">
            <span
              className={cn(
                "inline-flex min-h-8 items-center gap-2 rounded-full border px-3 py-1 text-xs font-extrabold uppercase tracking-wide",
                stats.status === "COMPLETED"
                  ? "border-accent/35 bg-accent text-accent-foreground"
                  : stats.status === "IN_PROGRESS"
                    ? "border-accent/40 bg-accent/15 text-accent"
                    : "border-primary-foreground/20 bg-primary-foreground/10 text-primary-foreground/80",
              )}
            >
              {stats.status === "IN_PROGRESS" ? (
                <span className="size-2 rounded-full bg-current motion-safe:animate-pulse" />
              ) : (
                <Clock3 className="size-4" aria-hidden />
              )}
              {statusCopy.label}
            </span>
            <span className="text-sm font-bold text-primary-foreground/65">
              {stats.competition.name} · {stats.season.name}
            </span>
          </div>
          <h2 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Rodada {stats.round}
          </h2>
          <p className="mt-3 max-w-2xl text-base font-medium leading-7 text-primary-foreground/70">
            {statusCopy.description}
          </p>
        </div>

        <div className="border-t border-primary-foreground/10 bg-primary-foreground/[0.04] p-5 sm:p-7 lg:flex lg:min-w-80 lg:flex-col lg:justify-center lg:border-l lg:border-t-0 lg:p-8">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-bold text-primary-foreground/65">
                Progresso dos resultados
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums">
                {stats.completedFixtures}/{stats.totalFixtures}
              </p>
            </div>
            <span className="text-lg font-extrabold text-accent tabular-nums">
              {completion}%
            </span>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-primary-foreground/10">
            <div
              className="h-full rounded-full bg-accent transition-[width] duration-500 motion-reduce:transition-none"
              style={{ width: `${completion}%` }}
            />
          </div>
          <p className="mt-4 text-sm font-semibold leading-6 text-primary-foreground/65">
            {stats.publicFixtures} jogos já públicos
            {stats.cancelledFixtures
              ? ` · ${stats.cancelledFixtures} cancelado${stats.cancelledFixtures === 1 ? "" : "s"}`
              : ""}
          </p>
        </div>
      </div>
    </section>
  );
}

function RoundHighlights({
  stats,
  contentState,
}: {
  stats: RoundStats;
  contentState: ReturnType<typeof getRoundContentState>;
}) {
  return (
    <section aria-labelledby="round-highlights-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2
            id="round-highlights-title"
            className="text-2xl font-extrabold text-foreground sm:text-3xl"
          >
            Destaques da rodada
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Reconhecimentos calculados somente com palpites que já podem ser
            públicos.
          </p>
        </div>
      </div>

      {contentState === "UPCOMING" ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-6 sm:p-8">
          <Clock3 className="size-8 text-muted-foreground" aria-hidden />
          <h3 className="mt-4 text-xl font-extrabold text-card-foreground">
            Destaques ainda protegidos
          </h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Antes do início dos jogos, a área não revela quem palpitou nem
            qualquer estatística que permita inferir palpites privados.
          </p>
        </div>
      ) : contentState === "NO_PREDICTIONS" ? (
        <div className="mt-5 rounded-2xl border border-dashed border-border bg-card p-6 sm:p-8">
          <UsersRound className="size-8 text-muted-foreground" aria-hidden />
          <h3 className="mt-4 text-xl font-extrabold text-card-foreground">
            Nenhum palpite público nesta rodada
          </h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Os destaques surgem quando pelo menos um participante elegível tem
            um palpite em jogo já iniciado.
          </p>
        </div>
      ) : (
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]">
          <FeaturedHighlight participant={stats.highlights.best} />
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <MetricHighlight
              icon={Target}
              label="Mais placares exatos"
              participants={stats.highlights.mostExactScores}
              unit="acerto"
            />
            <MetricHighlight
              icon={CheckCircle2}
              label="Mais vencedores acertados"
              participants={stats.highlights.mostCorrectWinners}
              unit="acerto"
              divided
            />
            <WorstHighlight participant={stats.highlights.worst} />
          </div>
        </div>
      )}
    </section>
  );
}

function FeaturedHighlight({
  participant,
}: {
  participant: RoundBestHighlightParticipant | null;
}) {
  const caption = getBestHighlightCaption(participant);

  return (
    <article className="relative overflow-hidden rounded-2xl bg-primary p-6 text-primary-foreground shadow-xl shadow-primary/20 sm:p-8">
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-sm font-bold text-primary-foreground/65">
            Melhor da rodada
          </p>
          {participant ? (
            <>
              <h3 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">
                {participant.name}
              </h3>
              <p className="mt-5 flex items-end gap-2">
                <span className="text-6xl font-black leading-none tabular-nums sm:text-7xl">
                  {participant.value}
                </span>
                <span className="pb-1 text-xl font-extrabold text-accent">
                  pts
                </span>
              </p>
              {caption ? (
                <p className="mt-5 text-sm font-semibold text-primary-foreground/65">
                  {caption}
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-5 max-w-md text-base font-semibold leading-7 text-primary-foreground/70">
              Ainda não há palpites avaliados para definir o melhor desempenho.
            </p>
          )}
        </div>
        <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-accent text-accent-foreground shadow-lg shadow-accent/20">
          <Crown className="size-7" aria-hidden />
        </span>
      </div>
    </article>
  );
}

function MetricHighlight({
  divided = false,
  icon: Icon,
  label,
  participants,
  unit,
}: {
  divided?: boolean;
  icon: typeof Target;
  label: string;
  participants: RoundHighlightParticipant[];
  unit: string;
}) {
  const value = participants[0]?.value ?? 0;

  return (
    <article
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 bg-muted/15 p-5 sm:p-6",
        divided && "border-t border-border",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-muted/70 text-muted-foreground">
        <Icon className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-muted-foreground">{label}</p>
        <p className="mt-1 truncate text-base font-extrabold text-card-foreground">
          {formatHighlightNames(participants)}
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-black text-foreground tabular-nums">
          {participants.length ? value : "—"}
        </p>
        {participants.length ? (
          <p className="mt-1 max-w-24 text-xs font-bold text-muted-foreground">
            {unit}
            {value === 1 ? "" : "s"}
          </p>
        ) : null}
      </div>
    </article>
  );
}

function WorstHighlight({
  participant,
}: {
  participant: RoundHighlightParticipant | null;
}) {
  return (
    <article className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 border-t border-border bg-muted/35 p-5 sm:p-6">
      <span className="flex size-11 items-center justify-center rounded-xl bg-card text-muted-foreground">
        <CircleX className="size-5" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-bold text-muted-foreground">
          Pior desempenho
        </p>
        <p className="mt-1 truncate text-lg font-extrabold text-card-foreground">
          {participant?.name ?? "Sem comparação disponível"}
        </p>
        {!participant ? (
          <p className="mt-1 text-xs font-semibold leading-5 text-muted-foreground">
            Exige ao menos dois participantes com palpites avaliados.
          </p>
        ) : null}
      </div>
      <p className="text-3xl font-black text-foreground tabular-nums">
        {participant ? participant.value : "—"}
      </p>
    </article>
  );
}

function MyRoundPerformance({ stats }: { stats: RoundStats }) {
  const performance = stats.myPerformance;

  return (
    <section aria-labelledby="my-round-performance-title">
      <h2
        id="my-round-performance-title"
        className="text-2xl font-extrabold text-foreground sm:text-3xl"
      >
        Seu desempenho
      </h2>

      {performance.predictionsCount === 0 ? (
        <div className="mt-5 flex flex-col gap-4 rounded-2xl border border-dashed border-border bg-card p-6 sm:flex-row sm:items-center sm:p-7">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            <Award className="size-6" aria-hidden />
          </span>
          <div>
            <h3 className="text-lg font-extrabold text-card-foreground">
              Você não fez palpites nesta rodada
            </h3>
            <p className="mt-1 text-sm leading-6 text-muted-foreground">
              Por isso, você não entra na classificação e não recebe uma posição
              artificial com zero ponto.
            </p>
          </div>
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="grid lg:grid-cols-[minmax(15rem,0.7fr)_minmax(0,1.3fr)]">
            <div className="bg-primary p-6 text-primary-foreground sm:p-7">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold text-primary-foreground/65">
                    Posição na rodada
                  </p>
                  <p className="mt-3 text-5xl font-black leading-none tabular-nums sm:text-6xl">
                    {performance.position ? `${performance.position}º` : "—"}
                  </p>
                </div>
                <Medal className="size-8 text-accent" aria-hidden />
              </div>
              <p className="mt-6 text-3xl font-black tabular-nums">
                {performance.naturalPoints} pts
              </p>
              <p className="mt-2 text-sm font-semibold text-primary-foreground/65">
                {performance.predictionsCount}/{stats.totalFixtures} palpites
              </p>
            </div>

            <dl className="grid grid-cols-2 sm:grid-cols-4">
              <PerformanceFact
                label="Placar exato"
                value={performance.exactScores}
              />
              <PerformanceFact
                label="Vencedores"
                value={performance.correctWinners}
              />
              <PerformanceFact
                label="Erros"
                value={performance.wrongPredictions}
              />
              <PerformanceFact
                label="Aproveitamento"
                value={
                  performance.accuracy === null
                    ? "—"
                    : `${formatPercentage(performance.accuracy)}%`
                }
                description={
                  performance.accuracy === null
                    ? "Sem jogos avaliados"
                    : `${performance.evaluatedPredictions} avaliados`
                }
              />
            </dl>
          </div>
        </div>
      )}
    </section>
  );
}

function PerformanceFact({
  description,
  label,
  value,
}: {
  description?: string;
  label: string;
  value: number | string;
}) {
  return (
    <div className="border-b border-border p-5 odd:border-r [&:nth-child(n+3)]:border-b-0 sm:border-b-0 sm:border-r sm:last:border-r-0 sm:p-6">
      <dt className="text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-3 text-3xl font-black text-card-foreground tabular-nums">
        {value}
      </dd>
      {description ? (
        <p className="mt-2 text-xs font-semibold leading-5 text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}

function RoundRanking({
  stats,
  contentState,
}: {
  stats: RoundStats;
  contentState: ReturnType<typeof getRoundContentState>;
}) {
  return (
    <section aria-labelledby="round-ranking-title">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2
            id="round-ranking-title"
            className="text-2xl font-extrabold text-foreground sm:text-3xl"
          >
            Classificação da rodada
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted-foreground sm:text-base">
            Pontos naturais; ajustes administrativos não entram neste ranking.
          </p>
        </div>
        {stats.ranking.length ? (
          <p className="text-sm font-bold text-muted-foreground">
            {stats.ranking.length === 1
              ? "1 participante elegível"
              : `${stats.ranking.length} participantes elegíveis`}
          </p>
        ) : null}
      </div>

      {contentState === "UPCOMING" ? (
        <div className="mt-5">
          <EmptyState
            icon={Clock3}
            title="Classificação protegida"
            description="A lista fica vazia até que os palpites possam ser públicos pelas regras atuais."
          />
        </div>
      ) : stats.ranking.length === 0 ? (
        <div className="mt-5">
          <EmptyState
            icon={UsersRound}
            title="Sem participantes elegíveis"
            description="Usuários sem palpites públicos nesta rodada não aparecem com zero ponto."
          />
        </div>
      ) : (
        <div className="mt-5 overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full border-collapse text-left">
              <thead className="bg-muted/70 text-xs font-extrabold uppercase tracking-wide text-muted-foreground">
                <tr>
                  <th scope="col" className="px-5 py-4">
                    Posição
                  </th>
                  <th scope="col" className="px-5 py-4">
                    Participante
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Palpites públicos
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Exatos
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Vencedores
                  </th>
                  <th scope="col" className="px-5 py-4 text-right">
                    Pontos
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {stats.ranking.map((participant) => (
                  <RankingTableRow
                    key={participant.userId}
                    participant={participant}
                    publicFixtures={stats.publicFixtures}
                  />
                ))}
              </tbody>
            </table>
          </div>

          <ol className="divide-y divide-border md:hidden">
            {stats.ranking.map((participant) => (
              <RankingMobileItem
                key={participant.userId}
                participant={participant}
                publicFixtures={stats.publicFixtures}
              />
            ))}
          </ol>
        </div>
      )}
    </section>
  );
}

function RankingTableRow({
  participant,
  publicFixtures,
}: {
  participant: RoundParticipant;
  publicFixtures: number;
}) {
  return (
    <tr className="transition-colors hover:bg-muted/35">
      <td className="px-5 py-4">
        <PositionBadge position={participant.position} />
      </td>
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <UserAvatar name={participant.name} />
          <span className="font-bold text-card-foreground">
            {participant.name}
          </span>
        </div>
      </td>
      <td className="px-5 py-4 text-right font-semibold text-muted-foreground tabular-nums">
        {participant.predictionsCount}/{publicFixtures}
      </td>
      <td className="px-5 py-4 text-right font-bold text-foreground tabular-nums">
        {participant.exactScores}
      </td>
      <td className="px-5 py-4 text-right font-bold text-foreground tabular-nums">
        {participant.correctWinners}
      </td>
      <td className="px-5 py-4 text-right text-xl font-black text-foreground tabular-nums">
        {participant.naturalPoints}
      </td>
    </tr>
  );
}

function RankingMobileItem({
  participant,
  publicFixtures,
}: {
  participant: RoundParticipant;
  publicFixtures: number;
}) {
  return (
    <li className="p-4 sm:p-5">
      <div className="flex items-center gap-3">
        <PositionBadge position={participant.position} />
        <UserAvatar name={participant.name} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-extrabold text-card-foreground">
            {participant.name}
          </p>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {participant.predictionsCount}/{publicFixtures} palpites públicos
          </p>
        </div>
        <p className="text-right">
          <span className="block text-2xl font-black text-foreground tabular-nums">
            {participant.naturalPoints}
          </span>
          <span className="text-xs font-bold text-muted-foreground">pts</span>
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-muted/65 p-3 text-center">
        <CompactFact label="Exatos" value={participant.exactScores} />
        <CompactFact label="Vencedores" value={participant.correctWinners} />
        <CompactFact label="Erros" value={participant.wrongPredictions} />
      </dl>
    </li>
  );
}

function PositionBadge({ position }: { position: number }) {
  return (
    <span
      className={cn(
        "inline-flex size-10 items-center justify-center rounded-xl text-sm font-black tabular-nums",
        position === 1
          ? "bg-accent text-accent-foreground"
          : "bg-muted text-foreground",
      )}
    >
      {position}º
    </span>
  );
}

function CompactFact({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <dt className="text-[0.6875rem] font-bold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 text-lg font-black text-foreground tabular-nums">
        {value}
      </dd>
    </div>
  );
}

function RoundsLoading() {
  return (
    <div className="space-y-5" role="status" aria-label="Carregando rodadas">
      <div className="h-32 animate-pulse rounded-2xl bg-muted" />
      <div className="h-72 animate-pulse rounded-2xl bg-muted" />
    </div>
  );
}

function RoundsStatsLoading() {
  return (
    <div
      className="space-y-5"
      role="status"
      aria-label="Carregando estatísticas da rodada"
    >
      <div className="h-64 animate-pulse rounded-2xl bg-muted" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
        <div className="h-72 animate-pulse rounded-2xl bg-muted" />
      </div>
    </div>
  );
}

function pickSeason(competition?: RoundCatalogCompetition) {
  return (
    competition?.seasons.find((season) => season.isActive) ??
    competition?.seasons[0] ??
    null
  );
}

function formatPercentage(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    maximumFractionDigits: 1,
  }).format(value);
}
