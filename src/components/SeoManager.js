import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://nexus.petertecnet.com.br";
const DEFAULT_TITLE = "Nexus | Catálogos digitais e produtos online";
const DEFAULT_DESCRIPTION = "Crie e compartilhe catálogos digitais com produtos, serviços e QR Code pela Nexus, uma plataforma Peter Tecnet.";

const PUBLIC_ROUTES = [
  { test: (path) => path === "/", title: DEFAULT_TITLE, description: DEFAULT_DESCRIPTION },
  { test: (path) => path.startsWith("/catalog/"), title: "Catálogo digital | Nexus", description: "Explore produtos e serviços deste catálogo digital na Nexus." },
  { test: (path) => path.startsWith("/item/view/") || path.startsWith("/item/"), title: "Item do catálogo | Nexus", description: "Veja detalhes, preço e informações deste item publicado na Nexus." },
];

const PRIVATE_PREFIXES = ["/login", "/register", "/password", "/email-verify", "/logout", "/user/", "/establishment/create", "/establishment/update", "/establishment/my", "/establishment/item", "/item/create", "/item/update", "/dashboard"];

function upsertMeta(selector, attrs) {
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    document.head.appendChild(element);
  }
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value));
}

function upsertCanonical(href) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
}

export default function SeoManager() {
  const location = useLocation();

  useEffect(() => {
    const path = location.pathname.replace(/\/+$/, "") || "/";
    const route = PUBLIC_ROUTES.find((candidate) => candidate.test(path));
    const indexable = Boolean(route) && !PRIVATE_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
    const title = route?.title || DEFAULT_TITLE;
    const description = route?.description || DEFAULT_DESCRIPTION;
    const canonical = `${SITE_URL}${path === "/" ? "/" : path}`;

    document.title = title;
    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', { name: "robots", content: indexable ? "index, follow, max-image-preview:large" : "noindex, nofollow" });
    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: canonical });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertCanonical(canonical);
  }, [location.pathname]);

  return null;
}
