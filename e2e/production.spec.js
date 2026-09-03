const { test, expect } = require("@playwright/test");

const apiBase = "https://api.petertecnet.com.br/api";
const storageBase = "https://api.petertecnet.com.br/storage";
const pixelPng = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
  "base64"
);

const establishmentFixture = {
  id: 10,
  app_id: 2,
  name: "Empresa E2E",
  fantasy: "Empresa E2E",
  slug: "catalogo-e2e",
  description: "Catálogo usado para validar a produção.",
  city: "São Paulo",
  uf: "SP",
  phone: "(11) 99999-9999",
  email: "empresa-e2e@example.com",
  website: "empresa-e2e.example.com",
  catalog_active: true,
  native_to_application: true,
  files: [
    {
      id: 1,
      type: "background",
      public_url: "uploads/empresa-e2e/capa.jpg",
    },
    {
      id: 2,
      type: "logo",
      public_url: "uploads/empresa-e2e/logo.jpg",
    },
  ],
};

const otherEstablishmentFixture = {
  id: 11,
  app_id: 2,
  name: "Outra Empresa E2E",
  fantasy: "Outra Empresa E2E",
  slug: "outra-empresa-e2e",
  description: "Outra empresa disponível para descoberta.",
  city: "São Paulo",
  uf: "SP",
  total_views: 48,
  files: [],
};

const catalogPayload = {
  target_application_id: 2,
  establishment: establishmentFixture,
  items: [
    {
      id: 99,
      entity_id: 10,
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
};

async function mockPublicApi(page) {
  await page.route(`${storageBase}/**`, async (route) => {
    return route.fulfill({
      status: 200,
      contentType: "image/png",
      body: pixelPng,
    });
  });

  await page.route(`${apiBase}/**`, async (route) => {
    const url = route.request().url();

    if (url.includes("/v1/apps/nexus/catalog/catalogo-e2e")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: catalogPayload }),
      });
    }

    if (url.includes("/v1/apps/nexus/directory")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          scope: { target_application_id: 2 },
          locations: [],
          establishments: [
            {
              ...establishmentFixture,
              total_views: 120,
              source_app: { id: 2, name: "Nexus", slug: "nexus" },
            },
            {
              ...otherEstablishmentFixture,
              source_app: { id: 2, name: "Nexus", slug: "nexus" },
            },
          ],
          items: [
            {
              id: 100,
              entity_id: 11,
              establishment_id: 11,
              app_id: 2,
              name: "Outro Produto E2E",
              slug: "outro-produto-e2e",
              description: "Item de outro catálogo para descoberta.",
              category: "Teste",
              price: 29.9,
              status: 1,
              type: "product",
              files: [],
              establishment: otherEstablishmentFixture,
            },
          ],
        }),
      });
    }

    if (url.includes("/home/2")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ city: "São Paulo", uf: "SP" }),
      });
    }

    return route.fulfill({ status: 404, contentType: "application/json", body: "{}" });
  });
}

const companyCard = (page) => page.getByRole("button", { name: /Empresa E2E/i }).first();

test.beforeEach(async ({ page }) => {
  await mockPublicApi(page);
});

test("public home is available without authentication", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator("body")).toContainText("Nexus");
  await expect(companyCard(page)).toBeVisible();
});

test("company discovery opens the public presentation instead of skipping to the catalog", async ({ page }) => {
  await page.goto("/");
  await companyCard(page).click();
  await expect(page).toHaveURL(/\/establishment\/view\/catalogo-e2e$/);
  await expect(page.getByRole("heading", { name: "Empresa E2E", exact: true })).toBeVisible();
});

test("protected company area redirects anonymous users to login", async ({ page }) => {
  await page.goto("/establishment/my");
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("heading", { name: /Bem-vindo à Nexus/i })).toBeVisible();
});

test("public company presentation loads without authentication and shows the cover experience", async ({ page }) => {
  await page.goto("/establishment/view/catalogo-e2e");
  await expect(page).toHaveURL(/\/establishment\/view\/catalogo-e2e$/);
  await expect(page.getByRole("heading", { name: "Empresa E2E", exact: true })).toBeVisible();
  await expect(page.locator(".estv-presentation-hero.has-cover")).toBeVisible();
  await expect(page.locator("body")).toContainText("Sobre Empresa E2E");
  await expect(page.locator("body")).toContainText("Acesse esta empresa rapidamente");
  await expect(page.getByRole("button", { name: "Ver catálogo", exact: true })).toBeVisible();
});

test("public company presentation exposes cross-catalog discovery links", async ({ page }) => {
  await page.goto("/establishment/view/catalogo-e2e");
  await expect(page.getByRole("heading", { name: "Descubra mais na Nexus" })).toBeVisible();
  await expect(page.getByText("Outra Empresa E2E", { exact: true })).toBeVisible();
  await expect(page.getByText("Outro Produto E2E", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: /Explorar a Nexus/i })).toBeVisible();
});

test("public company presentation direct navigation survives SPA server fallback", async ({ page }) => {
  const response = await page.goto("/establishment/view/catalogo-e2e");
  expect(response.status()).toBe(200);
  await expect(page.getByRole("heading", { name: "Empresa E2E", exact: true })).toBeVisible();
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
