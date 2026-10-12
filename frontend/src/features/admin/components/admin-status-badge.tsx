import { cn } from "@/lib/utils";

type AdminStatusBadgeProps = {
  label: string;
  tone?: "success" | "warning" | "danger" | "neutral" | "info";
};

export function AdminStatusBadge({
  label,
  tone = "neutral",
}: AdminStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide",
        tone === "success" && "bg-accent/15 text-green-800 dark:text-green-300",
        tone === "warning" && "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200",
        tone === "danger" && "bg-destructive/10 text-destructive",
        tone === "info" && "bg-sky-100 text-sky-900 dark:bg-sky-950 dark:text-sky-200",
        tone === "neutral" && "bg-muted text-muted-foreground",
      )}
    >
      {label}
    </span>
  );
}
