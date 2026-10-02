import type * as React from "react";

/** Shared design tokens for all Praticca email templates. */
export const palette = {
  brand: "#6366f1",
  brandDark: "#4f46e5",
  success: "#22c55e",
  warning: "#f59e0b",
  danger: "#ef4444",
  textPrimary: "#0f172a",
  textSecondary: "#334155",
  textMuted: "#64748b",
  border: "#e2e8f0",
  background: "#f1f5f9",
  cardBg: "#ffffff",
  footerBg: "#f8fafc",
};

export const baseStyles: Record<string, React.CSSProperties> = {
  body: {
    backgroundColor: palette.background,
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    margin: "0",
    padding: "0",
  },

  container: {
    maxWidth: "600px",
    margin: "0 auto",
    padding: "32px 16px",
  },

  logoSection: {
    textAlign: "center",
    marginBottom: "24px",
  },

  logo: {
    fontSize: "22px",
    fontWeight: "800",
    color: palette.brand,
    letterSpacing: "-0.02em",
    margin: "0",
  },

  card: {
    backgroundColor: palette.cardBg,
    borderRadius: "12px",
    padding: "40px 36px",
    boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
    marginBottom: "16px",
  },

  h1: {
    color: palette.textPrimary,
    fontSize: "22px",
    fontWeight: "700",
    lineHeight: "1.3",
    margin: "0 0 20px 0",
  },

  text: {
    color: palette.textSecondary,
    fontSize: "15px",
    lineHeight: "1.6",
    margin: "0 0 16px 0",
  },

  hint: {
    color: palette.textMuted,
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 12px 0",
  },

  warningText: {
    color: "#92400e",
    backgroundColor: "#fffbeb",
    borderRadius: "6px",
    padding: "10px 14px",
    fontSize: "13px",
    lineHeight: "1.5",
    margin: "0 0 16px 0",
  },

  ctaSection: {
    textAlign: "center",
    margin: "28px 0",
  },

  button: {
    backgroundColor: palette.brand,
    color: "#ffffff",
    borderRadius: "8px",
    fontSize: "15px",
    fontWeight: "600",
    padding: "13px 28px",
    textDecoration: "none",
    display: "inline-block",
  },

  hr: {
    borderColor: palette.border,
    borderWidth: "1px",
    margin: "24px 0",
  },

  linkFallback: {
    color: palette.textMuted,
    fontSize: "12px",
    margin: "0 0 4px 0",
  },

  linkText: {
    color: palette.brand,
    fontSize: "12px",
    wordBreak: "break-all",
    margin: "0 0 16px 0",
  },

  link: {
    color: palette.brand,
    textDecoration: "underline",
  },

  footer: {
    textAlign: "center",
    padding: "0 16px",
  },

  footerText: {
    color: palette.textMuted,
    fontSize: "12px",
    lineHeight: "1.5",
    margin: "0",
  },
};
