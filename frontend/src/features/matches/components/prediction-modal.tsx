"use client";

import { X } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PredictionForm } from "@/features/matches/components/prediction-form";
import {
  useCreatePrediction,
  useDeletePrediction,
  useUpdatePrediction,
} from "@/hooks/use-predictions";
import { getApiErrorMessage } from "@/lib/api-error";
import type { MatchFixture } from "@/types/fixture";

type PredictionModalProps = {
  fixture: MatchFixture | null;
  onClose: () => void;
};

export function PredictionModal({ fixture, onClose }: PredictionModalProps) {
  const createPrediction = useCreatePrediction();
  const updatePrediction = useUpdatePrediction();
  const deletePrediction = useDeletePrediction();

  useEffect(() => {
    if (!fixture) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [fixture, onClose]);

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

    try {
      if (fixture.userPrediction) {
        await updatePrediction.mutateAsync({
          predictionId: fixture.userPrediction.id,
          payload: values,
        });
        toast.success("Palpite atualizado.");
      } else {
        await createPrediction.mutateAsync({
          fixtureId: fixture.id,
          ...values,
        });
        toast.success("Palpite salvo.");
      }

      onClose();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Não foi possível salvar o palpite."));
    }
  }

  async function handleDelete() {
    if (!fixture?.userPrediction) {
      return;
    }

    try {
      await deletePrediction.mutateAsync(fixture.userPrediction.id);
      toast.success("Palpite removido.");
      onClose();
    } catch (err) {
      toast.error(
        getApiErrorMessage(err, "Não foi possível remover o palpite."),
      );
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/60 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Fechar modal"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="prediction-modal-title"
        className="relative max-h-[calc(100svh-1.5rem)] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl sm:p-8"
      >
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-accent">
              Palpite
            </p>
            <h2
              id="prediction-modal-title"
              className="mt-2 text-2xl font-extrabold leading-tight text-popover-foreground sm:text-3xl"
            >
              {fixture.homeTeam.name} x {fixture.awayTeam.name}
            </h2>
            <p className="mt-2 text-base font-semibold leading-7 text-muted-foreground">
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
