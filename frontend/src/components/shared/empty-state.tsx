import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function EmptyState({ title, description, icon: Icon }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center sm:p-10">
      {Icon ? (
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-muted text-muted-foreground">
          <Icon className="size-6" aria-hidden />
        </span>
      ) : null}
      <h3 className="mt-5 text-lg font-semibold text-card-foreground sm:text-xl">
        {title}
      </h3>
      <p className="mx-auto mt-2 max-w-[520px] text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
        {description}
      </p>
    </div>
  );
}
