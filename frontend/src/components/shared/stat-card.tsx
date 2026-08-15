import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
};

export function StatCard({ title, value, description, icon: Icon }: StatCardProps) {
  return (
    <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        {Icon ? (
          <span className="flex size-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <Icon className="size-5" aria-hidden />
          </span>
        ) : null}
      </div>
      {description ? (
        <p className="mt-4 text-sm leading-6 text-slate-600">{description}</p>
      ) : null}
    </article>
  );
}
