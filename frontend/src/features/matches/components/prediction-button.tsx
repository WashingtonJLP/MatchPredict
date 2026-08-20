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
      <Button disabled className="h-12 w-full rounded-xl text-base font-bold">
        Palpites encerrados
      </Button>
    );
  }

  if (fixture.userPrediction) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl border-accent/60 bg-accent/10 text-base font-bold text-accent hover:bg-accent hover:text-accent-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        onClick={onClick}
      >
        <Pencil className="size-5" aria-hidden />
        Alterar meu palpite
      </Button>
    );
  }

  if (fixture.canPredict) {
    return (
      <Button
        type="button"
        className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/80"
        onClick={onClick}
      >
        Fazer Palpite
      </Button>
    );
  }

  return (
    <Button disabled className="h-12 w-full rounded-xl text-base font-bold">
      Indisponível
    </Button>
  );
}
