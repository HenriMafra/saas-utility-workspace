import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-200",
        brand: "bg-brand-50 text-brand-700 dark:bg-brand-900 dark:text-brand-100",
        success: "bg-success-100 text-success-700",
        warning: "bg-warning-100 text-warning-700",
        danger: "bg-danger-100 text-danger-700",
      },
    },
    defaultVariants: { variant: "neutral" },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
