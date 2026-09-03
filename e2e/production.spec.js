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
  category: "Ferragista",
  segments: ["Ferramentas", "Construção"],
  city: "São Paulo",
  uf: "SP",
  phone: "(11) 99999-9999",
  email: "empresa-e2e@example.com",
  website: "empresa-e2e.example.com",
  catalog_active: true,
  native_to_application: true,
  business_profile: {
    open_24_hours: true,
    payment_methods: ["pix", "credit_card"],
    delivery_available: true,
    pickup_available: true,
    service_area: "São Paulo e região",
    accessibility: true,
    parking: true,
  },
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
  category: "Ferragista",
  segments: ["Ferramentas"],
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
      total_views: 10,
      files: [],
    },
    {
      id: 101,
      entity_id: 10,
      app_id: 2,
      name: "Martelo E2E",
      slug: "martelo-e2e",
      description: "Ferramenta para validar busca e categorias",
      category: "Ferramentas",
      price: 39.9,
      status: 1,
      type: "product",
      total_views: 90,
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

    if (url.includes("/interactions/batch")) {
      return route.fulfill({
        status: 202,
        contentType: "application/json",
        body: JSON.stringify({ accepted: 1, duplicates: 0 }),
      });
    }

    if (url.includes("/v1/apps/nexus/catalog/catalogo-e2e")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ success: true, data: catalogPayload }),
      });
    }

    if (url.includes("/v1/apps/nexus/discovery")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          success: true,
          scope: { application_id: 2 },
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
              category: "Ferramentas",
              price: 29.9,
              status: 1,
              type: "product",
              total_views: 55,
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

test("public company presentation loads cover, status and commercial facts", async ({ page }) => {
  await page.goto("/establishment/view/catalogo-e2e");
  await expect(page).toHaveURL(/\/establishment\/view\/catalogo-e2e$/);
  await expect(page.getByRole("heading", { name: "Empresa E2E", exact: true })).toBeVisible();
  await expect(page.locator(".estv-presentation-hero.has-cover")).toBeVisible();
  await expect(page.locator("body")).toContainText("Sobre Empresa E2E");
  await expect(page.locator("body")).toContainText("Aberto agora");
  await expect(page.locator("body")).toContainText("Pagamentos");
  await expect(page.locator("body")).toContainText("Acesse esta empresa rapidamente");
  await expect(page.getByRole("button", { name: /Explorar catálogo/i })).toBeVisible();
});

test("public company presentation searches and filters items inside the establishment", async ({ page }) => {
  await page.goto("/establishment/view/catalogo-e2e");

  const search = page.getByRole("searchbox", {
    name: "Buscar produtos e serviços de Empresa E2E",
  });
  await expect(search).toBeVisible();
  await search.fill("Martelo");

  await expect(page.locator("#establishment-catalog")).toContainText("Martelo E2E");
  await expect(page.locator("#establishment-catalog")).not.toContainText("Produto E2E");

  await page.getByRole("button", { name: "Limpar busca" }).click();
  await page.getByRole("button", { name: "Teste", exact: true }).click();
  await expect(page.locator("#establishment-catalog")).toContainText("Produto E2E");
  await expect(page.locator("#establishment-catalog")).not.toContainText("Martelo E2E");
});

test("each visible item can expose its own QR code", async ({ page }) => {
  await page.goto("/establishment/view/catalogo-e2e");
  await page.getByRole("button", { name: "Abrir QR Code de Produto E2E" }).click();
  await expect(page.getByRole("dialog")).toContainText("QR Code do item");
  await expect(page.getByRole("dialog")).toContainText("Produto E2E");
});

test("mobile establishment experience exposes the fixed action bar", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/establishment/view/catalogo-e2e");
  await expect(page.locator(".estx-mobile-bar")).toBeVisible();
  await expect(page.locator(".estx-mobile-bar")).toContainText("Catálogo");
  await expect(page.locator(".estx-mobile-bar")).toContainText("WhatsApp");
  await expect(page.locator(".estx-mobile-bar")).toContainText("Localização");
  await expect(page.locator(".estx-mobile-bar")).toContainText("Compartilhar");
});

test("public company presentation exposes contextual cross-catalog discovery links", async ({ page }) => {
  await page.goto("/establishment/view/catalogo-e2e");
  await expect(page.getByRole("heading", { name: "Continue descobrindo na Nexus" })).toBeVisible();
  await expect(page.locator(".estv-company-link").filter({ hasText: "Outra Empresa E2E" })).toBeVisible();
  await expect(page.locator(".estv-item-link").filter({ hasText: "Outro Produto E2E" })).toBeVisible();
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
