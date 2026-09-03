const trimTrailingSlash = (value) => String(value || "").replace(/\/+$/, "");

const apiBaseUrl = trimTrailingSlash(
  process.env.REACT_APP_API_BASE_URL || "https://api.petertecnet.com.br/api"
);

const storageUrl = `${trimTrailingSlash(
  process.env.REACT_APP_STORAGE_URL || "https://api.petertecnet.com.br/storage"
)}/`;

// Legacy numeric ID remains available as an application-context alias during
// the generic API migration. It still targets the same /v1/apps/{application}
// contract and never falls back to app-specific controllers.
const parsedAppId = Number(process.env.REACT_APP_ID || 2);
const appId = Number.isFinite(parsedAppId) && parsedAppId > 0 ? parsedAppId : 2;
const appSlug = String(process.env.REACT_APP_SLUG || "nexus").trim().toLowerCase();
const apiV1BaseUrl = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appSlug)}`;
const apiV1BaseUrls = [
  apiV1BaseUrl,
  `${apiBaseUrl}/v1/apps/${encodeURIComponent(String(appId))}`,
].filter((value, index, values) => value && values.indexOf(value) === index);

const linkApp = trimTrailingSlash(
  process.env.REACT_APP_PUBLIC_URL || "https://nexus.petertecnet.com.br"
);

const logoApp = `${linkApp}/images/logo.png`;

export {
  apiBaseUrl,
  apiV1BaseUrl,
  apiV1BaseUrls,
  storageUrl,
  appId,
  appSlug,
  linkApp,
  logoApp,
};
