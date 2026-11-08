"use client";

import { CalendarDays, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { PredictionForm } from "@/features/matches/components/prediction-form";
import { getFuturePredictionMessage } from "@/features/matches/prediction-availability";
import {
  useCreatePrediction,
  useDeletePrediction,
  useUpdatePrediction,
} from "@/hooks/use-predictions";
import { getApiErrorCode, getApiErrorMessage } from "@/lib/api-error";
import type { MatchFixture } from "@/types/fixture";

type PredictionModalProps = {
  fixture: MatchFixture | null;
  onClose: () => void;
};

const PARTICIPATION_REDIRECT_DELAY_MS = 1_250;

export function PredictionModal({ fixture, onClose }: PredictionModalProps) {
  const router = useRouter();
  const createPrediction = useCreatePrediction();
  const updatePrediction = useUpdatePrediction();
  const deletePrediction = useDeletePrediction();
  const participationRedirectTimer = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const [isRedirectingToParticipation, setIsRedirectingToParticipation] =
    useState(false);
  const [serverFuturePeriod, setServerFuturePeriod] = useState<{
    fixtureId: string;
    message: string;
  } | null>(null);

  useEffect(() => {
    setServerFuturePeriod(null);
    setIsRedirectingToParticipation(false);
    return () => {
      if (participationRedirectTimer.current) {
        clearTimeout(participationRedirectTimer.current);
      }
    };
  }, [fixture?.id]);

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
    deletePrediction.isPending ||
    isRedirectingToParticipation;
  const futureMessage =
    getFuturePredictionMessage(fixture.kickoff) ??
    (serverFuturePeriod?.fixtureId === fixture.id
      ? serverFuturePeriod.message
      : null);

  function goToParticipation() {
    if (participationRedirectTimer.current) {
      clearTimeout(participationRedirectTimer.current);
      participationRedirectTimer.current = null;
    }

    onClose();
    router.push("/participation");
  }

  async function handleSubmit(values: {
    homeGoals: number;
    awayGoals: number;
  }) {
    if (!fixture || isRedirectingToParticipation) {
      return;
    }

    const blockedMessage =
      getFuturePredictionMessage(fixture.kickoff) ?? futureMessage;
    if (blockedMessage) {
      setServerFuturePeriod({ fixtureId: fixture.id, message: blockedMessage });
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
      if (getApiErrorCode(err) === "FUTURE_PARTICIPATION_PERIOD") {
        setServerFuturePeriod({
          fixtureId: fixture.id,
          message: getApiErrorMessage(
            err,
            "O mês desta partida ainda não está disponível para palpites.",
          ),
        });
        return;
      }
      if (getApiErrorCode(err) === "PARTICIPATION_REQUIRED") {
        setIsRedirectingToParticipation(true);
        toast.error(
          "Você precisa de uma participação mensal ativa para palpitar neste período. Vamos levar você para Minha participação.",
          {
            action: {
              label: "Minha participação",
              onClick: goToParticipation,
            },
          },
        );
        participationRedirectTimer.current = setTimeout(
          goToParticipation,
          PARTICIPATION_REDIRECT_DELAY_MS,
        );
        return;
      }
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

  const title = fixture.userPrediction ? "Editar palpite" : "Criar palpite";

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-primary/55 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4">
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
        className="relative max-h-[calc(100svh-1.5rem)] w-full max-w-2xl overflow-y-auto rounded-2xl border border-border bg-popover p-4 text-popover-foreground shadow-2xl sm:p-6"
      >
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h2
              id="prediction-modal-title"
              className="text-2xl font-extrabold leading-tight text-popover-foreground"
            >
              {title}
            </h2>
            <p className="mt-2 truncate text-base font-bold leading-6 text-popover-foreground">
              {fixture.homeTeam.name} x {fixture.awayTeam.name}
            </p>
            <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 font-navigation text-xs font-bold uppercase tracking-wide text-muted-foreground">
              <CalendarDays className="size-4" aria-hidden />
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

        {futureMessage ? (
          <p
            role="status"
            className="text-base leading-7 text-muted-foreground"
          >
            {futureMessage}
          </p>
        ) : (
          <PredictionForm
            fixture={fixture}
            isSubmitting={isSubmitting}
            onDelete={fixture.userPrediction ? handleDelete : undefined}
            onSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
}
