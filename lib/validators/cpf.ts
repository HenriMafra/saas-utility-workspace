/**
 * Validação de CPF (Cadastro de Pessoas Físicas).
 *
 * Aceita CPF com ou sem formatação (pontos e traço).
 * Rejeita sequências uniformes ("000.000.000-00", "111.111.111-11", etc.)
 * e valida os dois dígitos verificadores pelo algoritmo oficial.
 */

/** Remove todos os caracteres não numéricos. */
export function stripCpf(value: string): string {
  return value.replace(/\D/g, "");
}

/**
 * Valida um CPF.
 * @param value CPF com ou sem formatação (ex.: "123.456.789-09" ou "12345678909")
 * @returns true se o CPF for válido
 */
export function isValidCpf(value: string): boolean {
  const digits = stripCpf(value);

  // Deve ter exatamente 11 dígitos
  if (digits.length !== 11) return false;

  // Rejeita sequências uniformes (00000000000 … 99999999999)
  if (/^(\d)\1{10}$/.test(digits)) return false;

  // Calcula o primeiro dígito verificador
  const sum1 = Array.from({ length: 9 }, (_, i) =>
    parseInt(digits[i]) * (10 - i)
  ).reduce((a, b) => a + b, 0);
  const remainder1 = (sum1 * 10) % 11;
  const digit1 = remainder1 >= 10 ? 0 : remainder1;

  if (digit1 !== parseInt(digits[9])) return false;

  // Calcula o segundo dígito verificador
  const sum2 = Array.from({ length: 10 }, (_, i) =>
    parseInt(digits[i]) * (11 - i)
  ).reduce((a, b) => a + b, 0);
  const remainder2 = (sum2 * 10) % 11;
  const digit2 = remainder2 >= 10 ? 0 : remainder2;

  return digit2 === parseInt(digits[10]);
}

/**
 * Formata um CPF numérico (11 dígitos) para "###.###.###-##".
 * Não valida — use isValidCpf antes se necessário.
 */
export function formatCpf(value: string): string {
  const d = stripCpf(value).slice(0, 11);
  return d
    .replace(/^(\d{3})/, "$1.")
    .replace(/^(\d{3})\.(\d{3})/, "$1.$2.")
    .replace(/^(\d{3})\.(\d{3})\.(\d{3})/, "$1.$2.$3-");
}
