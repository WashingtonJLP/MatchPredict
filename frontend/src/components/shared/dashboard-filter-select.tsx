"use client";

import { Select } from "@base-ui/react/select";
import { Check, ChevronDown, ChevronUp, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export type DashboardFilterOption = {
  badge?: string;
  label: string;
  value: string;
};

type DashboardFilterSelectProps = {
  className?: string;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onValueChange: (value: string) => void;
  options: DashboardFilterOption[];
  placeholder?: string;
  value: string;
};

export function DashboardFilterSelect({
  className,
  disabled = false,
  icon: Icon,
  label,
  onValueChange,
  options,
  placeholder = "Selecione",
  value,
}: DashboardFilterSelectProps) {
  const selectedOption = options.find((option) => option.value === value);
  const isDisabled = disabled || options.length === 0;

  return (
    <div className={cn("min-w-0", className)}>
      <Select.Root
        value={value}
        disabled={isDisabled}
        onValueChange={(selectedValue) => {
          if (selectedValue !== null) {
            onValueChange(selectedValue);
          }
        }}
      >
        <Select.Label className="sr-only">{label}</Select.Label>
        <Select.Trigger className="grid min-h-16 w-full min-w-0 grid-cols-[2.5rem_minmax(0,1fr)_2rem] items-center gap-3 rounded-2xl border border-input bg-card px-3 py-2.5 text-left text-foreground shadow-sm shadow-primary/5 outline-none transition-[border-color,background-color,box-shadow] hover:border-primary/25 hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-4 focus-visible:ring-ring/15 data-disabled:cursor-not-allowed data-disabled:bg-muted/60 data-disabled:text-muted-foreground data-popup-open:border-ring data-popup-open:bg-muted/30">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl shadow-sm transition-colors",
              isDisabled
                ? "bg-muted text-muted-foreground shadow-none"
                : "bg-primary text-primary-foreground shadow-primary/15",
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          <span className="min-w-0 overflow-hidden">
            <span className="block whitespace-nowrap text-[0.6875rem] font-extrabold uppercase leading-4 tracking-[0.08em] text-muted-foreground">
              {label}
            </span>
            <Select.Value>
              {() => (
                <span className="mt-0.5 block truncate font-navigation text-base font-extrabold leading-5 tabular-nums">
                  {selectedOption?.label ?? placeholder}
                </span>
              )}
            </Select.Value>
          </span>
          <Select.Icon
            className={cn(
              "flex size-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-transform duration-200 data-popup-open:rotate-180",
              isDisabled && "opacity-50",
            )}
          >
            <ChevronDown className="size-4" aria-hidden />
          </Select.Icon>
        </Select.Trigger>

        <Select.Portal>
          <Select.Positioner
            align="start"
            alignItemWithTrigger={false}
            collisionAvoidance={{
              side: "none",
              align: "shift",
              fallbackAxisSide: "none",
            }}
            collisionPadding={12}
            side="bottom"
            sideOffset={8}
            className="z-50 w-[var(--anchor-width)] max-w-[calc(100vw-1.5rem)] outline-none"
          >
            <Select.Popup className="max-h-[var(--available-height)] origin-[var(--transform-origin)] overflow-hidden rounded-2xl border border-border bg-popover text-popover-foreground shadow-xl shadow-primary/15 transition-[transform,opacity] duration-150 ease-out data-ending-style:scale-[0.98] data-ending-style:opacity-0 data-starting-style:scale-[0.98] data-starting-style:opacity-0">
              <Select.ScrollUpArrow className="flex h-7 items-center justify-center border-b border-border bg-popover text-muted-foreground">
                <ChevronUp className="size-4" aria-hidden />
              </Select.ScrollUpArrow>
              <Select.List className="max-h-[calc(min(var(--available-height),20rem)-3.5rem)] overflow-y-auto overscroll-contain p-1.5 scroll-py-2">
                {options.map((option) => (
                  <Select.Item
                    key={option.value}
                    value={option.value}
                    label={option.label}
                    className="grid min-h-12 cursor-default grid-cols-[2rem_minmax(0,1fr)_1.25rem] items-center gap-3 rounded-xl px-2.5 py-2 text-sm font-semibold text-popover-foreground outline-none transition-colors data-highlighted:bg-muted data-selected:bg-accent/10 data-selected:font-extrabold"
                  >
                    <span className="flex size-8 items-center justify-center rounded-lg bg-muted text-xs font-extrabold text-muted-foreground tabular-nums">
                      {option.badge ? (
                        option.badge
                      ) : (
                        <Icon className="size-4" aria-hidden />
                      )}
                    </span>
                    <Select.ItemText className="min-w-0 truncate">
                      {option.label}
                    </Select.ItemText>
                    <Select.ItemIndicator className="flex size-5 items-center justify-center rounded-full bg-accent text-accent-foreground">
                      <Check className="size-3.5" aria-hidden />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
              <Select.ScrollDownArrow className="flex h-7 items-center justify-center border-t border-border bg-popover text-muted-foreground">
                <ChevronDown className="size-4" aria-hidden />
              </Select.ScrollDownArrow>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
