import { useEffect } from "react";
import { apiBaseUrl, appSlug, linkApp } from "../config";
import "./EcosystemBottomNav.css";

const CORE_VERSION = "1.0.0";
const CORE_URL = `https://petertecnet.com.br/ecosystem/peter-frontend-core-v1.js?v=${CORE_VERSION}`;

function configureCore() {
  const core = window.PeterTecnetFrontendCore;
  if (!core || core.version !== CORE_VERSION) return false;

  core.configure({
    appSlug,
    apiBaseUrl,
    environment: process.env.NODE_ENV || "production",
    features: {
      api: true,
      auth: true,
      notifications: true,
      pwa: true,
      telemetry: true,
    },
    auth: { tokenKey: "token", userKey: "user" },
    api: { timeoutMs: 15000 },
    metadata: { appUrl: linkApp, framework: "react", integration: "gateway-v1" },
  });

  return true;
}

const bottomItems = [
  ["/", "⌂", "Início"],
  ["/establishment/my", "▦", "Catálogos"],
  ["/?focus=search", "⌕", "Buscar"],
  ["/purchases", "▣", "Compras"],
  ["/user/update", "○", "Perfil"],
];

function mountBottomNav() {
  if (!localStorage.getItem("token") || document.querySelector(".ecosystem-bottom-nav")) return;
  const nav = document.createElement("nav");
  nav.className = "ecosystem-bottom-nav";
  nav.setAttribute("aria-label", "Navegação principal mobile");
  nav.innerHTML = bottomItems.map(([href, icon, label]) => {
    const path = href.split("?")[0];
    const active = path === "/" ? window.location.pathname === "/" : window.location.pathname.startsWith(path);
    return `<a class="ecosystem-bottom-nav__item${active ? " active" : ""}" href="${href}"><span aria-hidden="true" style="font-size:22px;line-height:20px">${icon}</span><span>${label}</span></a>`;
  }).join("");
  nav.querySelector('a[href="/?focus=search"]')?.addEventListener("click", (event) => {
    event.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
    window.setTimeout(() => document.querySelector('.globalnav__searchBox input')?.focus(), 180);
  });
  document.body.appendChild(nav);
}

export default function PeterFrontendCoreGateway() {
  useEffect(() => {
    mountBottomNav();
    const onAuthChanged = () => {
      document.querySelector(".ecosystem-bottom-nav")?.remove();
      mountBottomNav();
    };
    window.addEventListener("authChanged", onAuthChanged);

    let cancelled = false;
    let script = document.querySelector(`script[data-peter-frontend-core="${CORE_VERSION}"]`);
    const onLoad = () => {
      if (cancelled) return;
      try { configureCore(); } catch (error) {
        console.warn("[Peter Tecnet Frontend Core] Falha ao configurar o runtime compartilhado.", error);
      }
    };
    const onError = () => {
      if (!cancelled) console.warn("[Peter Tecnet Frontend Core] Runtime indisponível; a Nexus seguirá usando seu frontend local.");
    };

    if (!configureCore()) {
      if (!script) {
        script = document.createElement("script");
        script.src = CORE_URL;
        script.async = true;
        script.dataset.peterFrontendCore = CORE_VERSION;
        document.head.appendChild(script);
      }
      script.addEventListener("load", onLoad);
      script.addEventListener("error", onError);
      if (window.PeterTecnetFrontendCore?.version === CORE_VERSION) onLoad();
    }

    return () => {
      cancelled = true;
      window.removeEventListener("authChanged", onAuthChanged);
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
      document.querySelector(".ecosystem-bottom-nav")?.remove();
    };
  }, []);

  return null;
}
