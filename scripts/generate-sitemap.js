const fs = require("fs");
const path = require("path");

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const publicUrl = trimTrailingSlash(process.env.REACT_APP_PUBLIC_URL || "https://nexus.petertecnet.com.br");
const apiBaseUrl = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL || "https://api.petertecnet.com.br/api");
const appSlug = String(process.env.REACT_APP_SLUG || "nexus").trim().toLowerCase();
const outputPath = path.resolve(__dirname, "../public/sitemap.xml");
const discoveryAttempts = Math.max(1, Number.parseInt(process.env.SITEMAP_DISCOVERY_ATTEMPTS || "4", 10) || 4);
const discoveryTimeoutMs = Math.max(1000, Number.parseInt(process.env.SITEMAP_DISCOVERY_TIMEOUT_MS || "10000", 10) || 10000);
const discoveryLimit = Math.min(100, Math.max(1, Number.parseInt(process.env.SITEMAP_DISCOVERY_LIMIT || "100", 10) || 100));
const discoveryConcurrency = Math.min(8, Math.max(1, Number.parseInt(process.env.SITEMAP_DISCOVERY_CONCURRENCY || "4", 10) || 4));

const escapeXml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "&apos;");

const safeSlug = (value) => {
  const slug = String(value || "").trim();
  return slug && !slug.includes("/") ? encodeURIComponent(slug) : null;
};

const buildUrlEntry = (pathname, changefreq, priority) => (
  `  <url><loc>${escapeXml(`${publicUrl}${pathname}`)}</loc><changefreq>${changefreq}</changefreq><priority>${priority}</priority></url>`
);

// Keep only indexable public acquisition surfaces in the sitemap. Auth/private
// routes such as /register intentionally stay out because SeoManager marks them noindex.
const baseEntries = [
  buildUrlEntry("/", "daily", "1.0"),
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchDiscoveryOnce(filters = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), discoveryTimeoutMs);

  try {
    const params = new URLSearchParams({ limit: String(discoveryLimit) });
    if (filters.target_city) params.set("target_city", filters.target_city);
    if (filters.target_uf) params.set("target_uf", filters.target_uf);

    const url = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appSlug)}/discovery?${params.toString()}`;
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "X-Peter-App": appSlug,
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Discovery respondeu HTTP ${response.status}`);
    }

    const payload = await response.json();
    if (!Array.isArray(payload?.establishments) || !Array.isArray(payload?.items)) {
      throw new Error("Discovery respondeu sem establishments/items indexáveis");
    }

    return payload;
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchDiscovery(filters = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= discoveryAttempts; attempt += 1) {
    try {
      return await fetchDiscoveryOnce(filters);
    } catch (error) {
      lastError = error;
      if (attempt >= discoveryAttempts) break;

      const delayMs = Math.min(4000, 500 * (2 ** (attempt - 1)));
      console.warn(`[sitemap] Discovery falhou na tentativa ${attempt}/${discoveryAttempts}: ${error.message}. Nova tentativa em ${delayMs}ms.`);
      await sleep(delayMs);
    }
  }

  throw lastError || new Error("Discovery indisponível");
}

const resourceKey = (resource) => String(resource?.id || resource?.slug || "").trim();

function mergeResources(target, resources) {
  for (const resource of resources || []) {
    const key = resourceKey(resource);
    if (key && !target.has(key)) target.set(key, resource);
  }
}

async function fetchDiscoveryAcrossLocations() {
  const initial = await fetchDiscovery();
  const establishments = new Map();
  const items = new Map();
  mergeResources(establishments, initial.establishments);
  mergeResources(items, initial.items);

  const locations = Array.isArray(initial.locations)
    ? initial.locations.filter((location) => location?.city && location?.uf)
    : [];

  let cursor = 0;
  const workers = Array.from({ length: Math.min(discoveryConcurrency, locations.length) }, async () => {
    while (cursor < locations.length) {
      const location = locations[cursor];
      cursor += 1;

      try {
        const scoped = await fetchDiscovery({ target_city: location.city, target_uf: location.uf });
        mergeResources(establishments, scoped.establishments);
        mergeResources(items, scoped.items);
      } catch (error) {
        // A single location must not erase the rest of the sitemap. Keep the
        // successful discovery set and surface the incomplete scope in build logs.
        console.warn(`[sitemap] Falha ao indexar ${location.city}/${location.uf}: ${error.message}`);
      }
    }
  });

  await Promise.all(workers);

  return {
    ...initial,
    establishments: [...establishments.values()],
    items: [...items.values()],
  };
}

function collectEntries(discovery) {
  const entries = [...baseEntries];
  const seen = new Set(["/"]);

  const add = (pathname, changefreq, priority) => {
    if (!pathname || seen.has(pathname)) return;
    seen.add(pathname);
    entries.push(buildUrlEntry(pathname, changefreq, priority));
  };

  for (const establishment of discovery.establishments) {
    const slug = safeSlug(establishment?.slug);
    if (!slug) continue;

    // Company pages support discovery; catalog pages are the highest-intent
    // public surface because they lead directly to item selection and checkout.
    add(`/establishment/view/${slug}`, "weekly", "0.8");
    add(`/catalog/${slug}`, "daily", "0.9");
  }

  for (const item of discovery.items) {
    const slug = safeSlug(item?.slug);
    if (slug) add(`/item/view/${slug}`, "weekly", "0.8");
  }

  return entries;
}

function writeSitemap(entries) {
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...entries,
    '</urlset>',
    '',
  ].join("\n");

  fs.writeFileSync(outputPath, xml, "utf8");
  console.log(`[sitemap] ${entries.length} URLs gravadas em public/sitemap.xml`);
}

(async () => {
  try {
    const discovery = await fetchDiscoveryAcrossLocations();
    const entries = collectEntries(discovery);
    writeSitemap(entries);
    console.log(`[sitemap] Discovery indexado com ${discovery.establishments.length} estabelecimentos e ${discovery.items.length} itens em ${discovery.locations?.length || 0} localidades.`);
  } catch (error) {
    console.warn(`[sitemap] Discovery indisponível após ${discoveryAttempts} tentativa(s): ${error.message}. Gerando sitemap base sem interromper o build.`);
    writeSitemap(baseEntries);
  }
})();
