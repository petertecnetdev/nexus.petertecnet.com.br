const { test, expect } = require("@playwright/test");

const apiBase = "https://api.petertecnet.com.br/api";

async function mockPublicApi(page) {
  await page.route(`${apiBase}/**`, async (route) => {
    const url = route.request().url();

    if (url.includes("/nexus/catalog/catalogo-e2e")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          establishment: {
            id: 10,
            app_id: 2,
            name: "Empresa E2E",
            fantasy: "Empresa E2E",
            slug: "catalogo-e2e",
            description: "Catálogo usado para validar a produção.",
            city: "São Paulo",
            uf: "SP",
            files: [],
          },
          items: [
            {
              id: 99,
              app_id: 2,
              name: "Produto E2E",
              slug: "produto-e2e",
              description: "Produto de validação",
              category: "Teste",
              price: 19.9,
              status: 1,
              type: "product",
              files: [],
            },
          ],
        }),
      });
    }

    if (url.includes("/home/2")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ establishments: [], items: [] }),
      });
    }

    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
}

test.beforeEach(async ({ page }) => {
  await mockPublicApi(page);
});

test("public home is available without authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).toContainText("Nexus");
});

test("protected company area redirects anonymous users to login", async ({ page }) => {
  await page.goto("/establishment/my");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Bem-vindo à Nexus/i })).toBeVisible();
});

test("public catalog loads without a token and exposes its item", async ({ page }) => {
  await page.goto("/catalog/catalogo-e2e");
  await expect(page.getByRole("heading", { name: "Empresa E2E" })).toBeVisible();
  await expect(page.locator("body")).toContainText("Produto E2E");
  await expect(page.locator("body")).toContainText("Compartilhe este catálogo");
});

test("unknown route renders a real 404 instead of silently redirecting", async ({ page }) => {
  await page.goto("/rota-que-nao-existe");
  await expect(page).toHaveURL(/\/rota-que-nao-existe$/);
  await expect(page.locator("body")).toContainText("Página não encontrada");
});

test("catalog direct navigation survives SPA server fallback", async ({ page }) => {
  const response = await page.goto("/catalog/catalogo-e2e");
  expect(response.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Empresa E2E" })).toBeVisible();
});
