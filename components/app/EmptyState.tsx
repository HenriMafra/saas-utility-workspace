import * as React from "react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface/50 px-6 py-14 text-center",
        className,
      )}
    >
      {icon && (
        <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-muted dark:bg-neutral-800">
          {icon}
        </span>
      )}
      <p className="font-medium text-fg">{title}</p>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
