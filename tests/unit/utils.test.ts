import { describe, it, expect } from "vitest";
import { reductionPercent, formatBytes, formatBRL } from "@/lib/utils";

// ---------------------------------------------------------------------------
// reductionPercent
// ---------------------------------------------------------------------------
describe("reductionPercent", () => {
  it("calcula 50% de redução corretamente", () => {
    expect(reductionPercent(1000, 500)).toBe(50);
  });

  it("calcula 0% quando before === after", () => {
    expect(reductionPercent(500, 500)).toBe(0);
  });

  it("retorna 0 quando before <= 0", () => {
    expect(reductionPercent(0, 100)).toBe(0);
    expect(reductionPercent(-50, 10)).toBe(0);
  });

  it("retorna 100% quando after === 0", () => {
    expect(reductionPercent(100, 0)).toBe(100);
  });

  it("não retorna valor negativo quando after > before", () => {
    expect(reductionPercent(100, 200)).toBe(0);
  });

  it("arredonda para inteiro", () => {
    // 1 - 333/1000 = 0.667 → 67%
    expect(reductionPercent(1000, 333)).toBe(67);
  });

  it("calcula 75% de redução", () => {
    expect(reductionPercent(4000, 1000)).toBe(75);
  });
});

// ---------------------------------------------------------------------------
// formatBytes
// ---------------------------------------------------------------------------
describe("formatBytes", () => {
  it("retorna '0 B' para zero", () => {
    expect(formatBytes(0)).toBe("0 B");
  });

  it("formata bytes corretamente", () => {
    expect(formatBytes(512)).toBe("512 B");
  });

  it("formata kilobytes", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("formata megabytes", () => {
    expect(formatBytes(1024 * 1024)).toBe("1 MB");
  });

  it("formata gigabytes", () => {
    expect(formatBytes(1024 * 1024 * 1024)).toBe("1 GB");
  });

  it("respeita o parâmetro decimals", () => {
    // formatBytes remove zeros à direita (1.50 -> 1.5), então usamos um valor
    // com segunda casa significativa: 1556/1024 = 1.5195... -> "1.52 KB".
    expect(formatBytes(1556, 2)).toBe("1.52 KB");
  });

  it("formata 2.5 MB corretamente", () => {
    expect(formatBytes(2.5 * 1024 * 1024, 1)).toBe("2.5 MB");
  });
});

// ---------------------------------------------------------------------------
// formatBRL
// ---------------------------------------------------------------------------
describe("formatBRL", () => {
  it("formata zero centavos", () => {
    // R$ 0,00
    expect(formatBRL(0)).toMatch(/0,00/);
  });

  it("formata R$ 1,00 (100 centavos)", () => {
    expect(formatBRL(100)).toMatch(/1,00/);
  });

  it("formata R$ 29,90 (2990 centavos)", () => {
    expect(formatBRL(2990)).toMatch(/29,90/);
  });

  it("inclui símbolo BRL", () => {
    const result = formatBRL(100);
    // Aceita tanto "R$" quanto o símbolo unicode "R $"
    expect(result).toMatch(/R\s*\$/);
  });

  it("formata valores grandes", () => {
    expect(formatBRL(100000)).toMatch(/1\.000,00/);
  });
});
