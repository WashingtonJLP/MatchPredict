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
        className="h-12 w-full rounded-xl text-base font-bold"
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
        className="h-12 w-full rounded-xl bg-primary text-base font-bold text-primary-foreground hover:bg-primary/80"
        onClick={onClick}
      >
        Fazer Palpite
      </Button>
    );
  }

  return (
    <Button disabled className="h-12 w-full rounded-xl text-base font-bold">
      Indisponivel
    </Button>
  );
}
