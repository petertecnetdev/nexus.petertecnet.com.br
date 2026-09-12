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

const baseEntries = [
  buildUrlEntry("/", "daily", "1.0"),
  buildUrlEntry("/register", "monthly", "0.7"),
];

const sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function fetchDiscoveryOnce() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), discoveryTimeoutMs);

  try {
    const url = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appSlug)}/discovery?limit=${discoveryLimit}`;
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

async function fetchDiscovery() {
  let lastError = null;

  for (let attempt = 1; attempt <= discoveryAttempts; attempt += 1) {
    try {
      return await fetchDiscoveryOnce();
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

function collectEntries(discovery) {
  const entries = [...baseEntries];
  const seen = new Set(["/", "/register"]);

  const add = (pathname, changefreq, priority) => {
    if (!pathname || seen.has(pathname)) return;
    seen.add(pathname);
    entries.push(buildUrlEntry(pathname, changefreq, priority));
  };

  for (const establishment of discovery.establishments) {
    const slug = safeSlug(establishment?.slug);
    if (slug) add(`/establishment/view/${slug}`, "weekly", "0.8");
  }

  for (const item of discovery.items) {
    const slug = safeSlug(item?.slug);
    if (slug) add(`/item/view/${slug}`, "weekly", "0.7");
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
    const discovery = await fetchDiscovery();
    const entries = collectEntries(discovery);
    writeSitemap(entries);
    console.log(`[sitemap] Discovery indexado com ${discovery.establishments.length} estabelecimentos e ${discovery.items.length} itens.`);
  } catch (error) {
    console.warn(`[sitemap] Discovery indisponível após ${discoveryAttempts} tentativa(s): ${error.message}. Gerando sitemap base sem interromper o build.`);
    writeSitemap(baseEntries);
  }
})();
