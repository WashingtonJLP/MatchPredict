"use client";

import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { Toaster } from "sonner";

export function AppToaster() {
  return (
    <Toaster
      richColors
      closeButton
      expand
      position="top-right"
      offset={{ top: 24, right: 24 }}
      mobileOffset={{ top: 96, right: 16, left: 16 }}
      icons={{
        success: <CheckCircle2 className="size-5" aria-hidden />,
        error: <AlertCircle className="size-5" aria-hidden />,
        warning: <TriangleAlert className="size-5" aria-hidden />,
        info: <Info className="size-5" aria-hidden />,
        close: <X className="size-3.5" aria-hidden />,
      }}
      toastOptions={{
        duration: 5000,
        classNames: {
          toast: "matchpredict-toast",
          title: "leading-snug text-[0.95rem] font-semibold",
          description: "text-sm leading-relaxed font-medium opacity-95",
          icon: "text-current",
          closeButton:
            "border-2 opacity-100 shadow-md transition hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
        },
      }}
    />
  );
}
