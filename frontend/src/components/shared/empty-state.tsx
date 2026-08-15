import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center shadow-sm shadow-primary/5 sm:p-10">
      {Icon ? (
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Icon className="size-7" aria-hidden />
        </span>
      ) : null}
      <h3 className="mt-5 text-xl font-bold text-card-foreground sm:text-2xl">
        {title}
      </h3>
      <p className="mx-auto mt-3 max-w-[560px] text-base leading-7 text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
