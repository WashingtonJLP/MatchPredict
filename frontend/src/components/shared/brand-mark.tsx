import { Trophy } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

type BrandMarkProps = {
  className?: string;
};

export function BrandMark({ className }: BrandMarkProps) {
  return (
    <Link
      href="/"
      className={cn(
        "inline-flex items-center gap-3 text-base font-semibold text-slate-950",
        className,
      )}
    >
      <span className="flex size-9 items-center justify-center rounded-lg bg-slate-950 text-white shadow-sm">
        <Trophy className="size-5" aria-hidden="true" />
      </span>
      <span>MatchPredict</span>
    </Link>
  );
}
