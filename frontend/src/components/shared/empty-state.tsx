import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      {Icon ? (
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <h3 className="mt-5 text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-2 max-w-[520px] text-base leading-7 text-slate-600">
        {description}
      </p>
    </div>
  );
}
