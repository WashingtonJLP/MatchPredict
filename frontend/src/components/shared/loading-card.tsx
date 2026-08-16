import { Skeleton } from "@/components/ui/skeleton";

type LoadingCardProps = {
  rows?: number;
};

export function LoadingCard({ rows = 3 }: LoadingCardProps) {
  return (
    <div
      className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6"
      role="status"
      aria-label="Carregando"
    >
      <Skeleton className="h-5 w-36" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <Skeleton key={index} className="h-12 rounded-xl" />
        ))}
      </div>
    </div>
  );
}
