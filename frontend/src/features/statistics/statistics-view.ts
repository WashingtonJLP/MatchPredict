export function buildStatisticsRoundFilterOptions(
  rounds: Array<{ round: number }>,
) {
  return rounds.map((round) => ({
    badge: String(round.round),
    label: `Rodada ${round.round}`,
    value: String(round.round),
  }));
}
