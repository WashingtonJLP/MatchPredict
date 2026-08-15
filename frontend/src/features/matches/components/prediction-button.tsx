import { Button } from "@/components/ui/button";
import type { MatchFixture } from "@/types/fixture";

type PredictionButtonProps = {
  fixture: MatchFixture;
  onClick: () => void;
};

export function PredictionButton({ fixture, onClick }: PredictionButtonProps) {
  const kickoffPassed = new Date(fixture.kickoff).getTime() <= Date.now();

  if (kickoffPassed) {
    return (
      <Button disabled className="h-11 w-full rounded-xl font-semibold">
        Palpites encerrados
      </Button>
    );
  }

  if (fixture.userPrediction) {
    return (
      <Button
        type="button"
        variant="outline"
        className="h-11 w-full rounded-xl font-semibold"
        onClick={onClick}
      >
        Editar Palpite
      </Button>
    );
  }

  if (fixture.canPredict) {
    return (
      <Button
        type="button"
        className="h-11 w-full rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/80"
        onClick={onClick}
      >
        Fazer Palpite
      </Button>
    );
  }

  return (
    <Button disabled className="h-11 w-full rounded-xl font-semibold">
      Indisponivel
    </Button>
  );
}
