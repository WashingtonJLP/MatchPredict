import type { RoundStats } from "@/types/round";

export type RoundContentState =
  "UPCOMING" | "NO_PREDICTIONS" | "IN_PROGRESS" | "COMPLETED";

export type RoundsCatalogState = "LOADING" | "ERROR" | "EMPTY" | "READY";

export function getRoundsCatalogState({
  competitionCount,
  isError,
  isLoading,
}: {
  competitionCount: number;
  isError: boolean;
  isLoading: boolean;
}): RoundsCatalogState {
  if (isLoading) return "LOADING";
  if (isError) return "ERROR";
  if (competitionCount === 0) return "EMPTY";
  return "READY";
}

export function getRoundContentState(stats: RoundStats): RoundContentState {
  if (stats.status === "UPCOMING") {
    return "UPCOMING";
  }

  if (stats.ranking.length === 0) {
    return "NO_PREDICTIONS";
  }

  return stats.status;
}

export function getRoundStatusCopy(stats: RoundStats) {
  if (stats.status === "UPCOMING") {
    return {
      label: "Rodada futura",
      description:
        "As estatísticas públicas aparecem conforme os jogos começam. Seus palpites continuam privados até o horário permitido.",
    };
  }

  if (stats.status === "COMPLETED") {
    return {
      label: "Rodada encerrada",
      description: `${stats.completedFixtures}/${stats.totalFixtures} jogos avaliados e pontuação consolidada.`,
    };
  }

  return {
    label: "Rodada em andamento",
    description: `${stats.completedFixtures}/${stats.totalFixtures} jogos avaliados. A classificação muda conforme os resultados são processados.`,
  };
}

export function formatHighlightNames(participants: Array<{ name: string }>) {
  if (participants.length === 0) {
    return "Sem destaque ainda";
  }

  if (participants.length <= 2) {
    return participants.map((participant) => participant.name).join(" e ");
  }

  return `${participants[0].name}, ${participants[1].name} +${participants.length - 2}`;
}
