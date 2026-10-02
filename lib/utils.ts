import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind classes with conflict resolution. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Human-readable byte size, pt-BR. */
export function formatBytes(bytes: number, decimals = 1): string {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))} ${sizes[i]}`;
}

/** Format cents (int) as BRL. */
export function formatBRL(cents: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(cents / 100);
}

/** Reduction percentage between two sizes. */
export function reductionPercent(before: number, after: number): number {
  if (before <= 0) return 0;
  return Math.max(0, Math.round((1 - after / before) * 100));
}

export function formatDateBR(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "medium", timeStyle: "short" }).format(d);
}

/** Stable client id for anonymous usage limits (device-scoped). */
export function getAnonId(): string {
  if (typeof window === "undefined") return "";
  const KEY = "praticca_anon_id";
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
