const fs = require("fs");
const path = require("path");

const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");
const publicUrl = trimTrailingSlash(process.env.REACT_APP_PUBLIC_URL || "https://nexus.petertecnet.com.br");
const apiBaseUrl = trimTrailingSlash(process.env.REACT_APP_API_BASE_URL || "https://api.petertecnet.com.br/api");
const appSlug = String(process.env.REACT_APP_SLUG || "nexus").trim().toLowerCase();
const outputPath = path.resolve(__dirname, "../public/sitemap.xml");

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

async function fetchDiscovery() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appSlug)}/discovery?limit=500`;
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

    return response.json();
  } finally {
    clearTimeout(timeout);
  }
}

function collectEntries(discovery) {
  const entries = [...baseEntries];
  const seen = new Set(["/", "/register"]);

  const add = (pathname, changefreq, priority) => {
    if (!pathname || seen.has(pathname)) return;
    seen.add(pathname);
    entries.push(buildUrlEntry(pathname, changefreq, priority));
  };

  for (const establishment of Array.isArray(discovery?.establishments) ? discovery.establishments : []) {
    const slug = safeSlug(establishment?.slug);
    if (slug) add(`/establishment/view/${slug}`, "weekly", "0.8");
  }

  for (const item of Array.isArray(discovery?.items) ? discovery.items : []) {
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
    writeSitemap(collectEntries(discovery));
  } catch (error) {
    console.warn(`[sitemap] Discovery indisponível: ${error.message}. Gerando sitemap base sem interromper o build.`);
    writeSitemap(baseEntries);
  }
})();
