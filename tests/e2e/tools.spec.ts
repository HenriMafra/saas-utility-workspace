import { test, expect, type Page } from "@playwright/test";
import path from "node:path";

const FX = path.join(__dirname, "fixtures");
const PDF = path.join(FX, "sample.pdf");
const PDF2 = path.join(FX, "sample2.pdf");
const PNG = path.join(FX, "sample.png");

const fileInput = (page: Page) => page.locator('input[type="file"]').first();
async function expectDownloadReady(page: Page) {
  await expect(page.getByRole("button", { name: /Baixar/i }).first()).toBeVisible({
    timeout: 45_000,
  });
}

test.describe("Ferramentas que processam arquivo no navegador", () => {
  test("Comprimir PDF → download", async ({ page }) => {
    await page.goto("/ferramentas/comprimir-pdf");
    await fileInput(page).setInputFiles(PDF);
    await expectDownloadReady(page);
  });

  test("Comprimir Imagem → download", async ({ page }) => {
    await page.goto("/ferramentas/comprimir-imagem");
    await fileInput(page).setInputFiles(PNG);
    await expectDownloadReady(page);
  });

  test("Juntar PDF → download", async ({ page }) => {
    await page.goto("/ferramentas/juntar-pdf");
    await fileInput(page).setInputFiles([PDF, PDF2]);
    await page.getByRole("button", { name: /Juntar/i }).click();
    await expectDownloadReady(page);
  });

  test("Dividir PDF → download", async ({ page }) => {
    await page.goto("/ferramentas/dividir-pdf");
    await fileInput(page).setInputFiles(PDF);
    await page.getByRole("button", { name: /Dividir PDF/i }).click();
    await expectDownloadReady(page);
  });

  test("Criar PDF (imagem) → download", async ({ page }) => {
    await page.goto("/ferramentas/criar-pdf");
    await fileInput(page).setInputFiles(PNG);
    await page.getByRole("button", { name: /Gerar PDF/i }).click();
    await expectDownloadReady(page);
  });

  test("Converter (imagem→PDF) → download", async ({ page }) => {
    await page.goto("/ferramentas/converter-pdf");
    await fileInput(page).setInputFiles(PNG);
    await page.getByRole("button", { name: /Converter/i }).click();
    await expectDownloadReady(page);
  });

  test("Redimensionar Imagem → download", async ({ page }) => {
    await page.goto("/ferramentas/redimensionar-imagem");
    await fileInput(page).setInputFiles(PNG);
    await page.getByRole("button", { name: /Redimensionar/i }).click();
    await expectDownloadReady(page);
  });
});

test.describe("Smoke — carrega página e H1", () => {
  const slugs = [
    "assinar-pdf",
    "ocr",
    "remover-fundo",
    "assistente-de-texto",
    "gerador-de-documentos",
    "gerador-de-curriculo",
    "calculadoras",
    "validador-gerador",
  ];
  for (const slug of slugs) {
    test(`${slug} carrega sem erro`, async ({ page }) => {
      const res = await page.goto(`/ferramentas/${slug}`);
      expect(res?.status() ?? 200).toBeLessThan(400);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
  }
});
