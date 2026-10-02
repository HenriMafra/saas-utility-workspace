import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, hint, error, id, ...props }, ref) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-fg">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          aria-invalid={!!error}
          aria-describedby={describedBy}
          className={cn(
            "h-11 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted",
            "focus-visible:border-brand-500 focus-visible:outline-none",
            error && "border-danger-500",
            className,
          )}
          {...props}
        />
        {error ? (
          <p id={`${inputId}-error`} className="mt-1.5 text-sm text-danger-500">
            {error}
          </p>
        ) : hint ? (
          <p id={`${inputId}-hint`} className="mt-1.5 text-sm text-muted">
            {hint}
          </p>
        ) : null}
      </div>
    );
  },
);
Input.displayName = "Input";
