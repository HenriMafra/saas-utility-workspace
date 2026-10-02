import type { AnalyticsEvent } from "./events";

/**
 * Privacy-friendly event tracking (Plausible/Umami compatible).
 * No PII in props. Safe no-op if no analytics provider is configured.
 */
export function track(event: AnalyticsEvent, props?: Record<string, string | number | boolean>) {
  if (typeof window === "undefined") return;
  // Plausible global, if present.
  const plausible = (window as unknown as { plausible?: (e: string, o?: object) => void }).plausible;
  if (plausible) {
    plausible(event, props ? { props } : undefined);
  }
  if (process.env.NEXT_PUBLIC_APP_ENV === "local") {
     
    console.debug("[analytics]", event, props ?? {});
  }
}
