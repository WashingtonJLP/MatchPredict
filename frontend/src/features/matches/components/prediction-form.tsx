"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { ScoreInput } from "@/features/matches/components/score-input";
import type { MatchFixture } from "@/types/fixture";

type PredictionFormValues = {
  homeGoals: number;
  awayGoals: number;
};

type PredictionFormProps = {
  fixture: MatchFixture;
  isSubmitting: boolean;
  onDelete?: () => void;
  onSubmit: (values: PredictionFormValues) => void;
};

export function PredictionForm({
  fixture,
  isSubmitting,
  onDelete,
  onSubmit,
}: PredictionFormProps) {
  const [homeGoals, setHomeGoals] = useState(
    fixture.userPrediction?.homeGoals ?? 0,
  );
  const [awayGoals, setAwayGoals] = useState(
    fixture.userPrediction?.awayGoals ?? 0,
  );

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          homeGoals,
          awayGoals,
        });
      }}
    >
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end gap-3 sm:gap-4">
        <ScoreInput
          label={fixture.homeTeam.name}
          value={homeGoals}
          onChange={setHomeGoals}
        />
        <span className="pb-4 text-2xl font-extrabold text-muted-foreground">x</span>
        <ScoreInput
          label={fixture.awayTeam.name}
          value={awayGoals}
          onChange={setAwayGoals}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        {fixture.userPrediction && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            className="h-12 rounded-xl text-base font-bold"
            onClick={onDelete}
            disabled={isSubmitting}
          >
            Excluir Palpite
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          className="h-12 rounded-xl bg-primary px-6 text-base font-bold text-primary-foreground hover:bg-primary/80"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Salvando..." : "Salvar Palpite"}
        </Button>
      </div>
    </form>
  );
}
