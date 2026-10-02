import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Service-role client. BYPASSES RLS — use only in Route Handlers / Edge Functions
 * after verifying the caller (webhook signature, admin role, cron token).
 * Never import this into a Client Component.
 */
export function createAdminClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
