import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config para testes E2E do Praticca.
 *
 * Por padrão os testes rodam contra http://localhost:3000 (servidor já em pé).
 * No CI, o webServer é iniciado automaticamente antes dos testes.
 *
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
  ],

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3100",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    locale: "pt-BR",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
    // Ative conforme necessário:
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],

  // Sobe o app (build de produção) em :3100 antes dos testes.
  // Requer um build prévio (npm run build). Reaproveita um servidor já em pé localmente.
  webServer: {
    command: "npx next start -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
