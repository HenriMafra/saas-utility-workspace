/**
 * lib/email/index.ts
 * Server-only email sender backed by Resend.
 * No secrets are exposed to the client — this file must never be imported
 * from client components.
 */
import "server-only";

import { Resend } from "resend";
import type { ReactElement } from "react";

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  react: ReactElement;
  /** Reply-to address (optional) */
  replyTo?: string;
}

let _resend: Resend | null = null;

function getResend(): Resend | null {
  if (_resend) return _resend;
  const key = process.env["RESEND_API_KEY"];
  if (!key) return null;
  _resend = new Resend(key);
  return _resend;
}

function getFromAddress(): string {
  return process.env["EMAIL_FROM"] ?? "Praticca <noreply@praticca.com.br>";
}

export async function sendEmail(opts: SendEmailOptions): Promise<void> {
  const resend = getResend();

  if (!resend) {
    // No-op in local/dev when RESEND_API_KEY is absent — just log
    console.warn("[email] RESEND_API_KEY not set — skipping send", {
      to: opts.to,
      subject: opts.subject,
    });
    return;
  }

  const { error } = await resend.emails.send({
    from: getFromAddress(),
    to: Array.isArray(opts.to) ? opts.to : [opts.to],
    subject: opts.subject,
    react: opts.react,
    ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
  });

  if (error) {
    console.error("[email] Resend send error", error);
    throw new Error(`[email] Failed to send "${opts.subject}": ${error.message}`);
  }
}
