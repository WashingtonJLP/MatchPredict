import type { LucideIcon } from "lucide-react";

type ErrorStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function ErrorState({ title, description, icon: Icon }: ErrorStateProps) {
  return (
    <div
      className="rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-sm shadow-primary/5 sm:p-10"
      role="alert"
    >
      {Icon ? (
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
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
