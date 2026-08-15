import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
};

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-3 text-2xl font-bold tracking-tight text-card-foreground sm:text-3xl">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent/10 text-accent">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-4 text-sm leading-6 text-muted-foreground">{description}</p>
      ) : null}
    </article>
  );
}
