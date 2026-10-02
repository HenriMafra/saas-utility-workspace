import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import type { LucideIcon } from "lucide-react";

export interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  trend?: { value: number; label: string };
  variant?: "default" | "success" | "warning" | "danger";
  className?: string;
}

const variantStyles: Record<NonNullable<StatCardProps["variant"]>, string> = {
  default: "text-brand-500",
  success: "text-success-500",
  warning: "text-warning-500",
  danger: "text-danger-500",
};

export function StatCard({
  label,
  value,
  description,
  icon: Icon,
  trend,
  variant = "default",
  className,
}: StatCardProps) {
  return (
    <Card className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-medium text-muted">{label}</span>
        {Icon && (
          <span
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-lg bg-surface",
              variantStyles[variant],
            )}
            aria-hidden
          >
            <Icon className="h-4 w-4" />
          </span>
        )}
      </div>

      <div className="flex items-end gap-2">
        <span
          className={cn("font-display text-3xl font-bold tabular-nums", variantStyles[variant])}
          aria-label={`${label}: ${value}`}
        >
          {value}
        </span>
        {trend && (
          <span
            className={cn(
              "mb-1 text-xs font-medium",
              trend.value >= 0 ? "text-success-500" : "text-danger-500",
            )}
            aria-label={`Variação: ${trend.value >= 0 ? "+" : ""}${trend.value}% ${trend.label}`}
          >
            {trend.value >= 0 ? "+" : ""}
            {trend.value}% {trend.label}
          </span>
        )}
      </div>

      {description && <p className="text-xs text-muted">{description}</p>}
    </Card>
  );
}
