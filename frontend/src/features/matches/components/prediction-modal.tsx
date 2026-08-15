"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PredictionForm } from "@/features/matches/components/prediction-form";
import {
  useCreatePrediction,
  useDeletePrediction,
  useUpdatePrediction,
} from "@/hooks/use-predictions";
import type { MatchFixture } from "@/types/fixture";

type PredictionModalProps = {
  fixture: MatchFixture | null;
  onClose: () => void;
};

export function PredictionModal({ fixture, onClose }: PredictionModalProps) {
  const createPrediction = useCreatePrediction();
  const updatePrediction = useUpdatePrediction();
  const deletePrediction = useDeletePrediction();

  if (!fixture) {
    return null;
  }

  const isSubmitting =
    createPrediction.isPending ||
    updatePrediction.isPending ||
    deletePrediction.isPending;

  async function handleSubmit(values: {
    homeGoals: number;
    awayGoals: number;
  }) {
    if (!fixture) {
      return;
    }

    if (fixture.userPrediction) {
      await updatePrediction.mutateAsync({
        predictionId: fixture.userPrediction.id,
        payload: values,
      });
    } else {
      await createPrediction.mutateAsync({
        fixtureId: fixture.id,
        ...values,
      });
    }

    onClose();
  }

  async function handleDelete() {
    if (!fixture?.userPrediction) {
      return;
    }

    await deletePrediction.mutateAsync(fixture.userPrediction.id);
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/60 px-3 py-3 sm:items-center sm:px-4">
      <div className="max-h-[calc(100svh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-3xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase text-accent">
              Palpite
            </p>
            <h2 className="mt-2 text-xl font-bold leading-tight text-popover-foreground sm:text-2xl">
              {fixture.homeTeam.name} x {fixture.awayTeam.name}
            </h2>
            <p className="mt-2 text-base leading-7 text-muted-foreground">
              Rodada {fixture.round}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Fechar"
            onClick={onClose}
          >
            <X className="size-5" aria-hidden />
          </Button>
        </div>

        <PredictionForm
          fixture={fixture}
          isSubmitting={isSubmitting}
          onDelete={fixture.userPrediction ? handleDelete : undefined}
          onSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}
