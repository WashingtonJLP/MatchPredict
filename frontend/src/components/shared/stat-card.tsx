import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
};

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <article className="group rounded-2xl border border-border bg-card p-5 shadow-sm shadow-primary/5 transition duration-200 hover:-translate-y-0.5 hover:border-accent/40 hover:shadow-lg hover:shadow-primary/10 sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold leading-6 text-muted-foreground">
            {title}
          </p>
          <p className="mt-3 break-words text-3xl font-extrabold leading-tight tracking-tight text-card-foreground sm:text-4xl">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl border border-accent/15 bg-accent/10 text-accent transition group-hover:bg-accent group-hover:text-accent-foreground">
            <Icon className="size-6" aria-hidden />
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-5 text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
          {description}
        </p>
      ) : null}
    </article>
  );
}
