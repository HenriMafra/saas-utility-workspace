/**
 * Verificação Cloudflare Turnstile.
 * Se TURNSTILE_SECRET_KEY não estiver configurado, retorna true (no-op).
 * Chame SOMENTE de server/route/edge.
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY;

  // No-op quando não configurado (ambiente local / testes).
  if (!secret) return true;

  // Token vazio com segredo configurado → falha.
  if (!token) return false;

  try {
    const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret, response: token }),
      // Evita pendurar a requisição indefinidamente.
      signal: AbortSignal.timeout(5000),
    });

    if (!res.ok) return false;

    const json = (await res.json()) as { success: boolean };
    return json.success === true;
  } catch (err) {
    console.error("[captcha] turnstile verify error:", err);
    // Em falha de rede, rejeita para não abrir brechas.
    return false;
  }
}
