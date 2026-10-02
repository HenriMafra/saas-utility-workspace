"use client";

import { Toaster as SonnerToaster } from "sonner";

/** App-wide toast host. Use `import { toast } from "sonner"` to trigger. */
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast: "rounded-lg border border-border bg-surface text-fg shadow-md",
          error: "border-danger-500",
          success: "border-success-500",
        },
      }}
    />
  );
}
