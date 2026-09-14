const fs = require("fs");
const path = require("path");

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const publicUrl = trimTrailingSlash(process.env.REACT_APP_PUBLIC_URL || "https://nexus.petertecnet.com.br");
const apiBaseUrl = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL || "https://api.petertecnet.com.br/api");
const appSlug = String(process.env.REACT_APP_SLUG || "nexus").trim().toLowerCase();
const outputPath = path.resolve(__dirname, "../public/sitemap.xml");
const fetchAttempts = Math.max(1, Number.parseInt(process.env.SITEMAP_DISCOVERY_ATTEMPTS || "4", 10) || 4);
const fetchTimeoutMs = Math.max(1000, Number.parseInt(process.env.SITEMAP_DISCOVERY_TIMEOUT_MS || "10000", 10) || 10000);
const pageSize = Math.min(100, Math.max(1, Number.parseInt(process.env.SITEMAP_DISCOVERY_LIMIT || "100", 10) || 100));
const maxPages = Math.min(1000, Math.max(1, Number.parseInt(process.env.SITEMAP_DISCOVERY_MAX_PAGES || "100", 10) || 100));

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

async function fetchJson(pathname, params = {}) {
  let lastError = null;

  for (let attempt = 1; attempt <= fetchAttempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), fetchTimeoutMs);

    try {
      const query = new URLSearchParams(params);
      const url = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appSlug)}${pathname}?${query.toString()}`;
      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          "X-Peter-App": appSlug,
        },
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`${pathname} respondeu HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      lastError = error;
      if (attempt >= fetchAttempts) break;

      const delayMs = Math.min(4000, 500 * (2 ** (attempt - 1)));
      console.warn(`[sitemap] ${pathname} falhou na tentativa ${attempt}/${fetchAttempts}: ${error.message}. Nova tentativa em ${delayMs}ms.`);
      await sleep(delayMs);
    } finally {
      clearTimeout(timeout);
    }
  }

  throw lastError || new Error(`${pathname} indisponível`);
}

async function fetchPaginatedCollection(pathname) {
  const resources = [];

  for (let page = 1; page <= maxPages; page += 1) {
    const payload = await fetchJson(pathname, {
      per_page: String(pageSize),
      page: String(page),
    });
    const paginator = payload?.data;
    const pageResources = Array.isArray(paginator?.data) ? paginator.data : null;

    if (!pageResources) {
      throw new Error(`${pathname} respondeu sem paginação canônica`);
    }

    resources.push(...pageResources);

    const currentPage = Number(paginator.current_page || page);
    const lastPage = Number(paginator.last_page || currentPage);
    if (pageResources.length < pageSize || currentPage >= lastPage) break;
  }

  return resources;
}

function collectEntries({ establishments, items }) {
  const entries = [...baseEntries];
  const seen = new Set(["/"]);

  const add = (pathname, changefreq, priority) => {
    if (!pathname || seen.has(pathname)) return;
    seen.add(pathname);
    entries.push(buildUrlEntry(pathname, changefreq, priority));
  };

  for (const establishment of establishments) {
    const slug = safeSlug(establishment?.slug);
    if (!slug) continue;

    add(`/establishment/view/${slug}`, "weekly", "0.8");
    add(`/catalog/${slug}`, "daily", "0.9");
  }

  for (const item of items) {
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
    const [establishments, items] = await Promise.all([
      fetchPaginatedCollection("/establishments"),
      fetchPaginatedCollection("/items"),
    ]);
    const entries = collectEntries({ establishments, items });
    writeSitemap(entries);
    console.log(`[sitemap] Catálogo público indexado com ${establishments.length} estabelecimentos e ${items.length} itens via endpoints paginados canônicos.`);
  } catch (error) {
    console.warn(`[sitemap] Catálogo público indisponível após ${fetchAttempts} tentativa(s): ${error.message}. Gerando sitemap base sem interromper o build.`);
    writeSitemap(baseEntries);
  }
})();
