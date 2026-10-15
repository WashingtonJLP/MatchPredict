import type { RoundBestHighlightParticipant, RoundStats } from "@/types/round";

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

export function formatRoundPoints(value: number) {
  return `${value} ${value === 1 ? "pt" : "pts"}`;
}

export function formatGameCount(value: number) {
  return `${value} ${value === 1 ? "jogo" : "jogos"}`;
}

export function getBestHighlightCaption(
  participant: RoundBestHighlightParticipant | null,
) {
  switch (participant?.tieBreakCriterion) {
    case "EXACT_SCORES":
      return "Desempate por mais placares exatos";
    case "CORRECT_WINNERS":
      return "Desempate por mais vencedores corretos";
    case "FEWER_WRONG_PREDICTIONS":
      return "Desempate por menos erros";
    case "EARLIER_REGISTRATION":
      return "Desempate pelo cadastro mais antigo";
    case "EARLIER_PREDICTION":
      return "Desempate pelo primeiro palpite registrado";
    case "STABLE_ID":
      return "Desempate pelo identificador estável";
    default:
      return null;
  }
}
