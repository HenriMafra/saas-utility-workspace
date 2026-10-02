import { describe, it, expect } from "vitest";
import { isValidCpf, formatCpf, stripCpf } from "@/lib/validators/cpf";

// ---------------------------------------------------------------------------
// CPFs válidos (verificados pelo algoritmo oficial)
// ---------------------------------------------------------------------------
const VALID_CPFS = [
  "529.982.247-25", // formatado
  "52998224725",     // sem formatação
  "111.444.777-35",
  "11144477735",
  "123.456.789-09",
  "12345678909",
  "000.000.001-91", // começa com zeros, mas é válido
  "00000000191",
];

// ---------------------------------------------------------------------------
// CPFs inválidos
// ---------------------------------------------------------------------------
const INVALID_CPFS = [
  "000.000.000-00", // sequência uniforme
  "111.111.111-11",
  "222.222.222-22",
  "333.333.333-33",
  "444.444.444-44",
  "555.555.555-55",
  "666.666.666-66",
  "777.777.777-77",
  "888.888.888-88",
  "999.999.999-99",
  "123.456.789-00", // dígito verificador errado
  "529.982.247-26", // último dígito errado
  "1234567890",     // 10 dígitos
  "123456789012",   // 12 dígitos
  "",               // vazio
  "abc.def.ghi-jk", // letras
];

describe("isValidCpf — CPFs válidos", () => {
  VALID_CPFS.forEach((cpf) => {
    it(`aceita ${cpf}`, () => {
      expect(isValidCpf(cpf)).toBe(true);
    });
  });
});

describe("isValidCpf — CPFs inválidos", () => {
  INVALID_CPFS.forEach((cpf) => {
    it(`rejeita "${cpf}"`, () => {
      expect(isValidCpf(cpf)).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// stripCpf
// ---------------------------------------------------------------------------
describe("stripCpf", () => {
  it("remove pontos e traço", () => {
    expect(stripCpf("529.982.247-25")).toBe("52998224725");
  });

  it("mantém apenas dígitos", () => {
    expect(stripCpf("  529.982.247-25  ")).toBe("52998224725");
  });

  it("retorna vazio para string vazia", () => {
    expect(stripCpf("")).toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatCpf
// ---------------------------------------------------------------------------
describe("formatCpf", () => {
  it("formata 11 dígitos no padrão ###.###.###-##", () => {
    expect(formatCpf("52998224725")).toBe("529.982.247-25");
  });

  it("reformata CPF já formatado", () => {
    expect(formatCpf("529.982.247-25")).toBe("529.982.247-25");
  });

  it("limita a 11 dígitos ao formatar", () => {
    expect(formatCpf("529982247251234")).toBe("529.982.247-25");
  });

  it("formata CPF com zeros à esquerda", () => {
    expect(formatCpf("00000000191")).toBe("000.000.001-91");
  });
});
