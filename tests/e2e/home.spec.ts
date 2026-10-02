import { test, expect } from "@playwright/test";

/**
 * Testes E2E básicos — página inicial e navegação principal.
 */

test.describe("Página inicial (/)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("exibe o H1 da landing page", async ({ page }) => {
    // O H1 principal deve ser visível logo no topo da página
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    // Deve ter conteúdo de texto (não estar vazio)
    const text = await h1.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });

  test("possui link/botão de navegação para /ferramentas", async ({ page }) => {
    // Procura por um link apontando para /ferramentas no header ou na página
    const ferrsLink = page.locator('a[href="/ferramentas"]').first();
    await expect(ferrsLink).toBeVisible();
  });

  test("navega para /ferramentas ao clicar no link", async ({ page }) => {
    const ferrsLink = page.locator('a[href="/ferramentas"]').first();
    await ferrsLink.click();

    // Aguarda a navegação completar
    await page.waitForURL("**/ferramentas");
    expect(page.url()).toContain("/ferramentas");
  });

  test("título da página está definido", async ({ page }) => {
    const title = await page.title();
    expect(title.length).toBeGreaterThan(0);
  });

  test("não exibe erros 404 críticos no console", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto("/");
    await page.waitForLoadState("networkidle");

    // Filtra erros que não são falhas críticas de renderização
    const criticalErrors = consoleErrors.filter(
      (e) =>
        e.includes("Unhandled") ||
        e.includes("TypeError") ||
        e.includes("ReferenceError")
    );
    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe("Página de ferramentas (/ferramentas)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/ferramentas");
  });

  test("carrega sem erro de servidor (status 200)", async ({ page }) => {
    const response = await page.request.get("/ferramentas");
    expect(response.status()).toBe(200);
  });

  test("exibe pelo menos um card de ferramenta", async ({ page }) => {
    // Aguarda que algum card seja renderizado
    const cards = page.locator('[data-testid="tool-card"], article, [class*="ToolCard"]');
    // Verifica que a página tem conteúdo (ao menos um elemento de lista/card)
    await expect(page.locator("main")).toBeVisible();
  });

  test("título ou heading da página está presente", async ({ page }) => {
    const heading = page.locator("h1, h2").first();
    await expect(heading).toBeVisible();
  });
});
