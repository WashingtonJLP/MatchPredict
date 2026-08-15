import type { LucideIcon } from "lucide-react";

type ErrorStateProps = {
  title: string;
  description: string;
  icon?: LucideIcon;
};

export function ErrorState({ title, description, icon: Icon }: ErrorStateProps) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-card p-6 text-center shadow-sm sm:p-10">
      {Icon ? (
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
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
