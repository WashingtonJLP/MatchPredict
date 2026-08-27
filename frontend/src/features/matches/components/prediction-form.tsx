"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [homeGoals, setHomeGoals] = useState(
    fixture.userPrediction?.homeGoals ?? 0,
  );
  const [awayGoals, setAwayGoals] = useState(
    fixture.userPrediction?.awayGoals ?? 0,
  );

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({
          homeGoals,
          awayGoals,
        });
      }}
    >
      <div className="grid items-stretch gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:gap-4">
        <ScoreInput
          team={fixture.homeTeam}
          value={homeGoals}
          onChange={setHomeGoals}
        />
        <span className="flex items-center justify-center rounded-2xl bg-muted px-3 py-2 text-sm font-extrabold uppercase tracking-wide text-muted-foreground sm:self-center">
          x
        </span>
        <ScoreInput
          team={fixture.awayTeam}
          value={awayGoals}
          onChange={setAwayGoals}
        />
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between">
        {fixture.userPrediction && onDelete ? (
          <Button
            type="button"
            variant="destructive"
            className="h-10 rounded-xl px-4 text-sm font-bold"
            onClick={() => setIsDeleteDialogOpen(true)}
            disabled={isSubmitting}
          >
            Excluir
          </Button>
        ) : (
          <span />
        )}
        <Button
          type="submit"
          className="h-10 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground hover:bg-primary/80"
          disabled={isSubmitting}
        >
          {isSubmitting
            ? "Salvando..."
            : fixture.userPrediction
              ? "Salvar alterações"
              : "Salvar palpite"}
        </Button>
      </div>

      <Dialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        titleId="delete-prediction-title"
      >
        <div className="space-y-5">
          <div>
            <h2
              id="delete-prediction-title"
              className="text-2xl font-extrabold text-popover-foreground"
            >
              Excluir palpite?
            </h2>
            <p className="mt-3 text-base leading-7 text-muted-foreground">
              Esta ação não poderá ser desfeita.
            </p>
          </div>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="outline"
              className="h-12 rounded-xl text-base font-bold"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="button"
              variant="destructive"
              className="h-12 rounded-xl text-base font-bold"
              onClick={() => {
                setIsDeleteDialogOpen(false);
                onDelete?.();
              }}
              disabled={isSubmitting}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Dialog>
    </form>
  );
}
