type LoadingCardProps = {
  rows?: number;
};

export function LoadingCard({ rows = 3 }: LoadingCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 sm:p-6">
      <div className="h-5 w-36 animate-pulse rounded bg-muted" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-12 animate-pulse rounded-xl bg-muted"
          />
        ))}
      </div>
    </div>
  );
}
