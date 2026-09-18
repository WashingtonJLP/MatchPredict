import assert from "node:assert/strict";
import test from "node:test";

import type {
  FootballCompetition,
  StandingZone,
  TournamentPhase,
  TournamentTie,
} from "../../types/competition.ts";
import {
  formatTournamentOutcome,
  formatTournamentScore,
  formatTournamentStatus,
  formatStandingValue,
  getCompetitionsPageCatalog,
  getDefaultCompetitionTab,
  getCompetitionDataState,
  getCompetitionTabs,
  getGroupSections,
  getKnockoutPhases,
  getRelevantKnockoutPhase,
  getStandingZoneVisual,
  getTeamScore,
  getTournamentPresentationPhases,
  normalizeTournamentLabel,
  removeCompetitionProviderAttribution,
  resolveCompetitionForRegion,
  resolveCompetitionSelection,
  resolveTournamentPhaseSelection,
  standingZoneColorClasses,
  standingZoneIndicatorClass,
  standingZoneLegendDotClass,
} from "./competition-view.ts";

function competition(
  id: string,
  capabilities: FootballCompetition["capabilities"],
  regionId = "test",
): FootballCompetition {
  return {
    id,
    name: id,
    shortName: id,
    regionId,
    format: "LEAGUE",
    logo: null,
    capabilities,
  };
}

test("cria somente as abas suportadas pela competição", () => {
  const league = competition("eng.1", {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  });
  const groupedCup = competition("conmebol.libertadores", {
    games: true,
    standings: true,
    groups: true,
    tournament: true,
  });

  assert.deepEqual(
    getCompetitionTabs(league).map((tab) => tab.id),
    ["games", "standings"],
  );
  assert.deepEqual(
    getCompetitionTabs(groupedCup).map((tab) => tab.id),
    ["games", "groups", "tournament"],
  );
});

test("seleciona a view estrutural padrão ao trocar de competição", () => {
  const league = competition("eng.1", {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  });
  const groupedCup = competition("conmebol.libertadores", {
    games: true,
    standings: true,
    groups: true,
    tournament: true,
  });
  const cup = competition("bra.copa_do_brazil", {
    games: true,
    standings: false,
    groups: false,
    tournament: true,
  });
  const leaguePhase = {
    ...league,
    id: "uefa.champions",
    format: "LEAGUE_PHASE" as const,
    capabilities: { ...league.capabilities, tournament: true },
  };

  assert.equal(getDefaultCompetitionTab(league), "standings");
  assert.equal(getDefaultCompetitionTab(groupedCup), "groups");
  assert.equal(getDefaultCompetitionTab(leaguePhase), "standings");
  assert.equal(getDefaultCompetitionTab(cup), "games");
});

test("seleciona o id solicitado ou usa a primeira competição", () => {
  const first = competition("eng.1", {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  });
  const second = competition("bra.1", first.capabilities);

  assert.equal(
    resolveCompetitionSelection("bra.1", [first, second])?.id,
    "bra.1",
  );
  assert.equal(
    resolveCompetitionSelection("invalid", [first, second])?.id,
    "eng.1",
  );
});

test("mantém competição e região sincronizadas por uma única seleção", () => {
  const capabilities = {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  };
  const premier = competition("eng.1", capabilities, "england");
  const brasileirao = competition("bra.1", capabilities, "brazil");
  const copa = competition("bra.copa_do_brazil", capabilities, "brazil");

  assert.equal(
    resolveCompetitionForRegion("brazil", [premier, brasileirao, copa], "eng.1")
      ?.id,
    "bra.1",
  );
  assert.equal(
    resolveCompetitionForRegion(
      "brazil",
      [premier, brasileirao, copa],
      "bra.copa_do_brazil",
    )?.id,
    "bra.copa_do_brazil",
  );
  assert.equal(
    resolveCompetitionSelection("eng.1", [premier, brasileirao])?.regionId,
    "england",
  );
});

test("limita a página às oito competições e remove a Copa do Brasil", () => {
  const capabilities = {
    games: true,
    standings: true,
    groups: false,
    tournament: false,
  };
  const ids = [
    "eng.1",
    "bra.1",
    "bra.2",
    "bra.copa_do_brazil",
    "uefa.champions",
    "uefa.europa",
    "esp.1",
    "ita.1",
    "ger.1",
    "fra.1",
    "conmebol.libertadores",
    "conmebol.sudamericana",
  ];
  const regionByCompetition: Record<string, string> = {
    "eng.1": "england",
    "bra.1": "brazil",
    "bra.2": "brazil",
    "bra.copa_do_brazil": "brazil",
    "uefa.champions": "europe",
    "uefa.europa": "europe",
    "esp.1": "spain",
    "ita.1": "italy",
    "ger.1": "germany",
    "fra.1": "france",
    "conmebol.libertadores": "south-america",
    "conmebol.sudamericana": "south-america",
  };
  const competitions = ids.map((id) =>
    competition(id, capabilities, regionByCompetition[id]),
  );
  const regions = [
    "england",
    "brazil",
    "europe",
    "spain",
    "italy",
    "germany",
    "france",
    "south-america",
  ].map((id) => ({ id, name: id, latitude: 0, longitude: 0 }));

  const pageCatalog = getCompetitionsPageCatalog(regions, competitions);

  assert.deepEqual(
    pageCatalog.competitions.map((item) => item.id),
    [
      "eng.1",
      "bra.1",
      "bra.2",
      "uefa.champions",
      "esp.1",
      "ita.1",
      "ger.1",
      "fra.1",
    ],
  );
  assert.equal(
    pageCatalog.regions.some((region) => region.id === "south-america"),
    false,
  );
  assert.equal(
    pageCatalog.regions.some((region) => region.id === "europe"),
    true,
  );
  assert.equal(pageCatalog.competitions.length, 8);
  assert.equal(
    pageCatalog.competitions.some(
      (competition) => competition.id === "bra.copa_do_brazil",
    ),
    false,
  );
});

test("remove atribuição visual ao provedor das mensagens", () => {
  assert.equal(
    removeCompetitionProviderAttribution(
      "A ESPN ainda não publicou a classificação desta competição.",
    ),
    "A classificação desta competição ainda não foi publicada.",
  );
  assert.equal(
    removeCompetitionProviderAttribution(
      "A ESPN retornou dados incompatíveis sobre o confronto.",
    ),
    "Foram recebidos dados incompatíveis sobre o confronto.",
  );
});

test("formata ausências sem convertê-las em zero", () => {
  assert.equal(formatStandingValue(null), "—");
  assert.equal(formatStandingValue(0), "0");
  assert.equal(getTeamScore(null, "1"), null);
  assert.equal(getTeamScore([{ teamId: "1", value: 0 }], "1"), 0);
  assert.equal(formatTournamentScore({ home: null, away: null }), null);
  assert.equal(formatTournamentScore({ home: 0, away: 0 }), "0 x 0");
});

test("diferencia dados vazios de recurso não aplicável", () => {
  assert.equal(getCompetitionDataState(false, 0), "NOT_APPLICABLE");
  assert.equal(getCompetitionDataState(true, 0), "EMPTY");
  assert.equal(getCompetitionDataState(true, 1), "READY");
});

test("preserva grupos densos com entradas e seleciona somente fases eliminatórias", () => {
  const sections = [
    { id: "a", name: "Grupo A", entries: [] },
    { id: "b", name: "Grupo B", entries: [{}] },
  ];
  const phases = [
    { id: "groups", kind: "TABLE" },
    { id: "round-of-16", kind: "KNOCKOUT" },
  ];

  assert.deepEqual(
    getGroupSections(sections as never).map((section) => section.id),
    ["b"],
  );
  assert.deepEqual(
    getKnockoutPhases(phases as never).map((phase) => phase.id),
    ["round-of-16"],
  );
});

test("prioriza as quatro fases finais na apresentação do mata-mata", () => {
  const phases = [
    { id: "first", slug: "first-stage", kind: "KNOCKOUT" },
    { id: "round", slug: "round-of-16", kind: "KNOCKOUT" },
    { id: "quarters", slug: "quarterfinals", kind: "KNOCKOUT" },
    { id: "semis", slug: "semifinals", kind: "KNOCKOUT" },
    { id: "final", slug: "final", kind: "KNOCKOUT" },
  ];

  assert.deepEqual(
    getTournamentPresentationPhases(phases as TournamentPhase[]).map(
      (phase) => phase.id,
    ),
    ["round", "quarters", "semis", "final"],
  );
});

test("mapeia zonas europeias e de rebaixamento sem inferir pela posição", () => {
  assert.deepEqual(
    getStandingZoneVisual(zone("CONTINENTAL_PRIMARY", "Champions League")),
    {
      kind: "CONTINENTAL_PRIMARY",
      label: "Champions League",
    },
  );
  assert.equal(
    getStandingZoneVisual(zone("CONTINENTAL_SECONDARY", "Europa League")).kind,
    "CONTINENTAL_SECONDARY",
  );
  assert.equal(
    getStandingZoneVisual(
      zone("CONTINENTAL_TERTIARY_QUALIFYING", "Conference League qualifying"),
    ).kind,
    "CONTINENTAL_TERTIARY_QUALIFYING",
  );
  assert.deepEqual(
    getStandingZoneVisual(zone("RELEGATION_PLAYOFF", "Relegation playoff")),
    {
      kind: "RELEGATION_PLAYOFF",
      label: "Playoff contra o rebaixamento",
    },
  );
  assert.deepEqual(getStandingZoneVisual(zone("RELEGATION", "Relegation")), {
    kind: "RELEGATION",
    label: "Rebaixamento",
  });
});

test("usa indicadores e círculos sólidos consistentes para todas as zonas", () => {
  assert.equal(
    standingZoneIndicatorClass,
    "absolute inset-y-2 left-0 w-1 rounded-r-full",
  );
  assert.equal(standingZoneLegendDotClass, "size-2 rounded-full");

  for (const colorClass of Object.values(standingZoneColorClasses)) {
    assert.match(colorClass, /^bg-/);
    assert.doesNotMatch(colorClass, /border|outline|ring/);
  }
});

test("escolhe a fase em andamento antes de uma próxima fase apenas TBD", () => {
  const oldPhase = phase("quarterfinals", "Quartas de final", {
    completed: true,
    kickoff: "2026-08-20T20:00:00Z",
  });
  const currentPhase = phase("semifinals", "Semifinais", {
    completed: false,
    kickoff: "2026-09-18T20:00:00Z",
    startDate: "2026-09-01T00:00:00Z",
    endDate: "2026-10-01T00:00:00Z",
  });
  const nextPhase = phase("final", "Final", {
    completed: false,
    kickoff: "2026-11-10T20:00:00Z",
    state: "TBD",
    tieState: "TBD",
  });

  assert.equal(
    getRelevantKnockoutPhase(
      [oldPhase, currentPhase, nextPhase],
      new Date("2026-09-15T12:00:00Z"),
    )?.id,
    "semifinals",
  );
});

test("escolhe a próxima fase publicada e mantém fallback seguro", () => {
  const nextPhase = phase("semifinals", "Semifinais", {
    completed: false,
    kickoff: "2026-11-01T20:00:00Z",
  });
  const laterPhase = phase("final", "Final", {
    completed: false,
    kickoff: "2026-12-01T20:00:00Z",
  });
  const unpublished = {
    ...phase("round-of-16", "Oitavas de final", {
      completed: false,
      kickoff: null,
    }),
    state: "NOT_PUBLISHED" as const,
    ties: [],
  };

  assert.equal(
    getRelevantKnockoutPhase(
      [nextPhase, laterPhase],
      new Date("2026-09-15T12:00:00Z"),
    )?.id,
    "semifinals",
  );
  assert.equal(getRelevantKnockoutPhase([unpublished])?.id, "round-of-16");
});

test("mantém uma única fase selecionada na navegação mobile", () => {
  const roundOf16 = phase("round-of-16", "Oitavas de final", {
    completed: true,
    kickoff: "2026-08-01T20:00:00Z",
  });
  const quarterfinals = phase("quarterfinals", "Quartas de final", {
    completed: false,
    kickoff: "2026-09-20T20:00:00Z",
  });

  assert.equal(
    resolveTournamentPhaseSelection(
      null,
      [roundOf16, quarterfinals],
      "quarterfinals",
    )?.id,
    "quarterfinals",
  );
  assert.equal(
    resolveTournamentPhaseSelection(
      "round-of-16",
      [roundOf16, quarterfinals],
      "quarterfinals",
    )?.id,
    "round-of-16",
  );
});

test("normaliza labels conhecidos e monta desfecho com dados estruturados", () => {
  assert.equal(normalizeTournamentLabel("ROUND OF 16"), "Oitavas de final");
  assert.equal(normalizeTournamentLabel("QUARTERFINALS"), "Quartas de final");
  assert.equal(normalizeTournamentLabel("SEMIFINALS"), "Semifinais");
  assert.equal(normalizeTournamentLabel("FINAL"), "Final");
  assert.equal(formatTournamentStatus("SCHEDULED"), "Agendado");
  assert.equal(
    formatTournamentStatus("FINAL_PENALTIES"),
    "Encerrado nos pênaltis",
  );

  const tie = tournamentTie();

  assert.equal(
    formatTournamentOutcome(tie),
    "Palmeiras avança por 5 x 3 no agregado",
  );
  assert.equal(
    formatTournamentOutcome({
      ...tie,
      aggregate: [
        { teamId: "palmeiras", value: 3 },
        { teamId: "gremio", value: 3 },
      ],
      penalties: null,
      winnerTeamId: null,
    }),
    "Empate no agregado",
  );
  assert.equal(
    formatTournamentOutcome({
      ...tie,
      aggregate: [
        { teamId: "palmeiras", value: 3 },
        { teamId: "gremio", value: 3 },
      ],
      penalties: [
        { teamId: "palmeiras", value: 5 },
        { teamId: "gremio", value: 4 },
      ],
    }),
    "Palmeiras avança nos pênaltis por 5 x 4",
  );
});

test("mantém agregado e vencedor associados por team ID no caso Fluminense x Platense", () => {
  const tie: TournamentTie = {
    ...tournamentTie(),
    teams: [
      {
        id: "3445",
        name: "Fluminense",
        abbreviation: "FLU",
        logo: null,
      },
      {
        id: "7764",
        name: "Platense",
        abbreviation: "PLA",
        logo: null,
      },
    ],
    aggregate: [
      { teamId: "7764", value: 2 },
      { teamId: "3445", value: 3 },
    ],
    winnerTeamId: null,
    penalties: null,
  };

  assert.equal(getTeamScore(tie.aggregate, "3445"), 3);
  assert.equal(getTeamScore(tie.aggregate, "7764"), 2);
  assert.equal(formatTournamentOutcome(tie), null);
});

function zone(
  type: StandingZone["type"],
  description: string,
  origin: StandingZone["origin"] = "SOURCE_EXPLICIT",
): StandingZone {
  return { type, description, origin, rank: null, color: null };
}

function phase(
  id: string,
  name: string,
  options: {
    completed: boolean;
    kickoff: string | null;
    startDate?: string;
    endDate?: string;
    state?: TournamentPhase["state"];
    tieState?: TournamentTie["state"];
  },
): TournamentPhase {
  return {
    id,
    sourceTypeId: null,
    slug: id,
    name,
    sourceName: name,
    kind: "KNOCKOUT",
    startDate: options.startDate ?? null,
    endDate: options.endDate ?? null,
    state: options.state ?? "AVAILABLE",
    ties: [
      {
        ...tournamentTie(),
        id: `${id}-tie`,
        state: options.tieState ?? "AVAILABLE",
        completed: options.completed,
        legs: options.kickoff
          ? [
              {
                id: `${id}-leg`,
                kickoff: options.kickoff,
                leg: 1,
                legLabel: "Ida",
                status: options.completed ? "FINAL" : "SCHEDULED",
                statusLabel: "",
                homeTeam: null,
                awayTeam: null,
                score: { home: null, away: null },
              },
            ]
          : [],
      },
    ],
  };
}

function tournamentTie(): TournamentTie {
  return {
    id: "tie",
    title: "QUARTERFINALS",
    state: "AVAILABLE",
    teams: [
      {
        id: "palmeiras",
        name: "Palmeiras",
        abbreviation: null,
        logo: null,
      },
      {
        id: "gremio",
        name: "Grêmio",
        abbreviation: null,
        logo: null,
      },
    ],
    legs: [],
    aggregate: [
      { teamId: "palmeiras", value: 5 },
      { teamId: "gremio", value: 3 },
    ],
    penalties: null,
    winnerTeamId: "palmeiras",
    completed: true,
    note: "2nd Leg - Palmeiras advance 5-3 on aggregate",
    progression: null,
  };
}
