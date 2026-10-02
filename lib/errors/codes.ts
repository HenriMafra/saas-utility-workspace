/** Central catalog of error codes. Keep in sync with docs/04. */
export const ERROR_CODES = {
  // Auth
  AUTH_INVALID_CREDENTIALS: { http: 401, user: "E-mail ou senha incorretos." },
  AUTH_WEAK_PASSWORD: { http: 422, user: "Senha fraca. Adicione mais caracteres, um número e um símbolo." },
  AUTH_EMAIL_NOT_CONFIRMED: { http: 403, user: "Confirme seu e-mail para continuar." },
  AUTH_TOO_MANY_ATTEMPTS: { http: 429, user: "Muitas tentativas. Tente de novo em alguns minutos." },
  AUTH_SESSION_EXPIRED: { http: 401, user: "Sua sessão expirou. Entre novamente." },
  AUTH_MFA_INVALID: { http: 401, user: "Código incorreto ou expirado. Tente de novo." },
  // Billing
  BILLING_WEBHOOK_FAILED: { http: 500, user: "Erro ao processar o pagamento." },
  BILLING_PLAN_NOT_RELEASED: { http: 500, user: "Pagamento recebido, liberando seu plano…" },
  BILLING_CHECKOUT_FAILED: { http: 502, user: "Não conseguimos iniciar o pagamento. Tente novamente." },
  // Tools
  TOOL_PROCESSING_FAILED: { http: 500, user: "Não consegui processar esse arquivo. Tente novamente — nada foi salvo." },
  TOOL_PDF_LOCKED: { http: 422, user: "Esse PDF tem senha. Informe-a para continuar." },
  TOOL_FILE_CORRUPT: { http: 422, user: "Não consegui abrir esse arquivo — pode estar corrompido." },
  TOOL_FILE_TOO_LARGE: { http: 413, user: "Arquivo acima do limite permitido." },
  TOOL_FILE_TYPE_INVALID: { http: 415, user: "Esse formato não é suportado aqui." },
  TOOL_CLIENT_OOM: { http: 500, user: "Seu navegador não deu conta desse arquivo. Tente um menor ou o modo servidor (Pro)." },
  TOOL_OCR_LOW_CONF: { http: 200, user: "Qualidade baixa — tente uma imagem mais nítida." },
  // Upload / Storage
  UPLOAD_FAILED: { http: 500, user: "Upload caiu. Tentando de novo…" },
  STORAGE_FAILED: { http: 500, user: "Falha ao salvar o arquivo." },
  // Limits / Security
  RATE_LIMIT_REACHED: { http: 402, user: "Você atingiu o limite de hoje. Assine o Pro ou compre créditos." },
  CAPTCHA_FAILED: { http: 403, user: "Verificação de segurança falhou. Recarregue e tente de novo." },
  INSUFFICIENT_CREDITS: { http: 402, user: "Créditos insuficientes para esta ação." },
  // Generic
  UNAUTHENTICATED: { http: 401, user: "Você precisa entrar para fazer isso." },
  FORBIDDEN: { http: 403, user: "Você não tem acesso a isso." },
  NOT_FOUND: { http: 404, user: "Não encontramos o que você procura." },
  VALIDATION: { http: 422, user: "Alguns campos estão inválidos." },
  API_EXTERNAL_DOWN: { http: 503, user: "Esse serviço está ocupado. Tente em instantes." },
  UNKNOWN: { http: 500, user: "Algo deu errado. Tente novamente." },
} as const;

export type ErrorCode = keyof typeof ERROR_CODES;
