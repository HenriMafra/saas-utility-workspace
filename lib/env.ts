import { z } from "zod";

/**
 * Validated public env (client-safe). Server-only secrets are read directly
 * from process.env inside server modules to avoid bundling them.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url().default("http://localhost:3000"),
  NEXT_PUBLIC_APP_ENV: z.enum(["local", "development", "staging", "production"]).default("local"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
});

type PublicEnv = z.infer<typeof publicSchema>;

const rawPublicEnv = {
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_TURNSTILE_SITE_KEY: process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
};

const parsed = publicSchema.safeParse(rawPublicEnv);

if (!parsed.success && process.env.NEXT_PUBLIC_APP_ENV === "production") {
  // In production we want loud failure in logs, but never crash the render.
   
  console.error("[env] Variáveis públicas inválidas:", parsed.error.flatten().fieldErrors);
}

/**
 * Public env. Importing this never throws (so builds and offline dev work).
 * Real validity is enforced operationally by the admin health-check.
 */
export const publicEnv: PublicEnv = parsed.success
  ? parsed.data
  : {
      NEXT_PUBLIC_APP_URL: rawPublicEnv.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
      NEXT_PUBLIC_APP_ENV:
        (rawPublicEnv.NEXT_PUBLIC_APP_ENV as PublicEnv["NEXT_PUBLIC_APP_ENV"]) || "local",
      NEXT_PUBLIC_SUPABASE_URL: rawPublicEnv.NEXT_PUBLIC_SUPABASE_URL || "",
      NEXT_PUBLIC_SUPABASE_ANON_KEY: rawPublicEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: rawPublicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: rawPublicEnv.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    };

/** Read a required server secret at call time (throws if missing). */
export function serverEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env var: ${key}`);
  return v;
}
