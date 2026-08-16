"use client";

import { X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type DialogProps = {
  children: React.ReactNode;
  className?: string;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  titleId?: string;
};

export function Dialog({
  children,
  className,
  onOpenChange,
  open,
  titleId,
}: DialogProps) {
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onOpenChange(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => document.removeEventListener("keydown", handleKeyDown, true);
  }, [onOpenChange, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center bg-primary/60 px-3 py-3 backdrop-blur-sm sm:items-center sm:px-4">
      <button
        type="button"
        aria-label="Fechar dialog"
        className="absolute inset-0 cursor-default"
        onClick={() => onOpenChange(false)}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className={cn(
          "relative max-h-[calc(100svh-1.5rem)] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-popover p-5 text-popover-foreground shadow-2xl sm:p-6",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

type DialogCloseButtonProps = {
  onClick: () => void;
};

export function DialogCloseButton({ onClick }: DialogCloseButtonProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label="Fechar"
      onClick={onClick}
    >
      <X className="size-5" aria-hidden />
    </Button>
  );
}
