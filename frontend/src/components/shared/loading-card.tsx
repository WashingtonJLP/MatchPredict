type LoadingCardProps = {
  rows?: number;
};

export function LoadingCard({ rows = 3 }: LoadingCardProps) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="mt-5 space-y-3">
        {Array.from({ length: rows }).map((_, index) => (
          <div
            key={index}
            className="h-10 animate-pulse rounded-lg bg-slate-100"
          />
        ))}
      </div>
    </div>
  );
}
