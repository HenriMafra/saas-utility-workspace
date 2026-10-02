import { type NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /confirmar
 *
 * Handles two cases:
 *   1. E-mail confirmation (signup): Supabase sends ?code=... to this URL.
 *   2. Password recovery:            Supabase sends ?code=...&mode=recovery
 *      (we pass ?mode=recovery in the redirectTo of resetPasswordForEmail).
 *
 * After exchanging the code for a session the user is redirected to:
 *   - /redefinir-senha   (password recovery flow)
 *   - ?next param        (if present)
 *   - /dashboard         (default)
 */
export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);

  const code = searchParams.get("code");
  const mode = searchParams.get("mode"); // "recovery" | null
  const next = searchParams.get("next");

  // If there is no code we cannot proceed — redirect to login with a hint.
  if (!code) {
    return NextResponse.redirect(
      new URL(`/login?error=link_invalido`, origin),
    );
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    // Don't expose the raw Supabase error; redirect with a generic flag.
    return NextResponse.redirect(
      new URL(`/login?error=link_invalido`, origin),
    );
  }

  // Determine destination after successful code exchange.
  let destination: string;

  if (mode === "recovery") {
    destination = "/redefinir-senha";
  } else if (next) {
    // Basic open-redirect guard: only allow relative paths.
    destination = next.startsWith("/") ? next : "/dashboard";
  } else {
    destination = "/dashboard";
  }

  return NextResponse.redirect(new URL(destination, origin));
}
