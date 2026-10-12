"use client";

import { X } from "lucide-react";
import { useEffect, useRef } from "react";

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
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previouslyFocused = document.activeElement as HTMLElement | null;
    const dialog = dialogRef.current;
    const focusableSelector =
      'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const initialFocus =
      dialog?.querySelector<HTMLElement>("[data-dialog-initial-focus]") ??
      dialog?.querySelector<HTMLElement>(focusableSelector) ??
      dialog;
    initialFocus?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        onOpenChange(false);
        return;
      }

      if (event.key === "Tab" && dialog) {
        const focusable = Array.from(
          dialog.querySelectorAll<HTMLElement>(focusableSelector),
        ).filter((element) => !element.hasAttribute("disabled"));
        if (!focusable.length) {
          event.preventDefault();
          dialog.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      previouslyFocused?.focus();
    };
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
        ref={dialogRef}
        tabIndex={-1}
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
