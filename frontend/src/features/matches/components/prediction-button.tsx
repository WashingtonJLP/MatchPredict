import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { MatchFixture } from "@/types/fixture";

type PredictionButtonProps = {
  fixture: MatchFixture;
  onClick: () => void;
};

export function PredictionButton({ fixture, onClick }: PredictionButtonProps) {
  const predictionClosed =
    new Date(fixture.kickoff).getTime() <= Date.now() ||
    fixture.status === "LIVE" ||
    fixture.status === "FT";

  if (predictionClosed) {
    return (
      <Button disabled className="h-10 rounded-xl px-4 text-sm font-bold">
        Encerrado
      </Button>
    );
  }

  if (fixture.userPrediction) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-10 rounded-xl border-primary/25 bg-primary/5 px-4 text-sm font-bold text-primary shadow-sm shadow-primary/5 hover:bg-primary hover:text-primary-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={onClick}
      >
        <Pencil className="size-4" aria-hidden />
        Editar palpite
      </Button>
    );
  }

  if (fixture.canPredict) {
    return (
      <Button
        type="button"
        className="h-10 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/80"
        onClick={onClick}
      >
        Palpitar
      </Button>
    );
  }

  return (
    <Button disabled className="h-10 rounded-xl px-4 text-sm font-bold">
      Indisponível
    </Button>
  );
}
