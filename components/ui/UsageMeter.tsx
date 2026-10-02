"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

export interface UsageMeterProps {
  used: number;
  limit: number;
  /** When true, render an upgrade hint. */
  blocked?: boolean;
}

export function UsageMeter({ used, limit, blocked }: UsageMeterProps) {
  if (limit >= 9999) return null;
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const near = pct >= 80;
  return (
    <div className="text-sm">
      <div className="mb-1 flex items-center justify-between text-muted">
        <span>Uso de hoje</span>
        <span>
          {used}/{limit}
        </span>
      </div>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            blocked || near ? "bg-warning-500" : "bg-brand-500",
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
      {blocked && (
        <p className="mt-2 text-muted">
          Limite atingido.{" "}
          <Link href="/precos" className="font-medium text-brand-500 hover:underline">
            Assine o Pro
          </Link>{" "}
          para uso ilimitado.
        </p>
      )}
    </div>
  );
}
