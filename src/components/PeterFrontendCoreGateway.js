import { useEffect } from "react";
import { apiBaseUrl, appSlug, linkApp } from "../config";

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
    auth: {
      tokenKey: "token",
      userKey: "user",
    },
    api: {
      timeoutMs: 15000,
    },
    metadata: {
      appUrl: linkApp,
      framework: "react",
      integration: "gateway-v1",
    },
  });

  return true;
}

export default function PeterFrontendCoreGateway() {
  useEffect(() => {
    if (configureCore()) return undefined;

    let cancelled = false;
    let script = document.querySelector(`script[data-peter-frontend-core="${CORE_VERSION}"]`);

    const onLoad = () => {
      if (cancelled) return;
      try {
        configureCore();
      } catch (error) {
        console.warn("[Peter Tecnet Frontend Core] Falha ao configurar o runtime compartilhado.", error);
      }
    };

    const onError = () => {
      if (!cancelled) {
        console.warn("[Peter Tecnet Frontend Core] Runtime indisponível; a Nexus seguirá usando seu frontend local.");
      }
    };

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

    return () => {
      cancelled = true;
      script?.removeEventListener("load", onLoad);
      script?.removeEventListener("error", onError);
    };
  }, []);

  return null;
}
