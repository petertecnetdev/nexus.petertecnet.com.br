const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const apiBaseUrl = trimTrailingSlash(
  process.env.REACT_APP_API_BASE_URL || "https://api.petertecnet.com.br/api"
);

const storageUrl = `${trimTrailingSlash(
  process.env.REACT_APP_STORAGE_URL || "https://api.petertecnet.com.br/storage"
)}/`;

const parsedAppId = Number(process.env.REACT_APP_ID || 2);
const appId = Number.isFinite(parsedAppId) && parsedAppId > 0 ? parsedAppId : 2;

const linkApp = trimTrailingSlash(
  process.env.REACT_APP_PUBLIC_URL || "https://nexus.petertecnet.com.br"
);

const logoApp = `${linkApp}/images/logo.png`;

export { apiBaseUrl, storageUrl, appId, linkApp, logoApp };
