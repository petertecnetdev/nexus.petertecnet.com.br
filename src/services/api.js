import axios from "axios";
import { apiV1BaseUrl, appSlug } from "../config";

const api = axios.create({
  baseURL: apiV1BaseUrl,
  timeout: 20000,
  headers: {
    Accept: "application/json",
    "X-Peter-App": appSlug,
  },
});

let refreshPromise = null;

const readToken = () => localStorage.getItem("token");
const writeToken = (token) => localStorage.setItem("token", token);
const clearToken = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  localStorage.removeItem("employer");
};

const extractToken = (payload) =>
  payload?.access_token ??
  payload?.token?.access_token ??
  payload?.token?.original?.access_token ??
  payload?.token ??
  null;

const emitApiTelemetry = (type, config, extra = {}) => {
  if (typeof window === "undefined") return;
  const startedAt = Number(config?.metadata?.nexusStartedAt || 0);
  const durationMs = startedAt ? Math.max(0, Math.round(performance.now() - startedAt)) : null;
  window.dispatchEvent(
    new CustomEvent("nexus:api", {
      detail: {
        type,
        method: String(config?.method || "GET").toUpperCase(),
        path: String(config?.url || "").split("?")[0].slice(0, 300),
        duration_ms: durationMs,
        ...extra,
      },
    })
  );
};

async function refreshAccessToken() {
  const currentToken = readToken();
  if (!currentToken) throw new Error("Sessão indisponível.");

  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${apiV1BaseUrl}/auth/refresh`,
        {},
        {
          timeout: 15000,
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${currentToken}`,
            "X-Peter-App": appSlug,
          },
        }
      )
      .then(({ data }) => {
        const nextToken = extractToken(data);
        if (!nextToken) throw new Error("A API não retornou um token renovado.");
        writeToken(nextToken);
        return nextToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

api.interceptors.request.use((config) => {
  const token = readToken();
  config.headers = config.headers || {};
  config.headers["X-Peter-App"] = appSlug;
  config.metadata = {
    ...(config.metadata || {}),
    nexusStartedAt: typeof performance !== "undefined" ? performance.now() : 0,
  };

  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    emitApiTelemetry("api_success", response?.config, {
      status: response?.status,
    });
    return response;
  },
  async (error) => {
    const status = error?.response?.status;
    const originalRequest = error?.config || {};
    const url = String(originalRequest?.url || "");
    const refreshable =
      status === 401 &&
      !originalRequest.__nexusRetried &&
      !/\/auth\/(login|google|refresh|logout)/.test(url) &&
      Boolean(readToken());

    if (refreshable) {
      originalRequest.__nexusRetried = true;
      try {
        const token = await refreshAccessToken();
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      } catch {
        // Fall through to a clean logout below.
      }
    }

    emitApiTelemetry("api_error", originalRequest, {
      status: status || 0,
      code: String(error?.code || "").slice(0, 80),
    });

    if (status === 401) {
      clearToken();
      window.dispatchEvent(new Event("authChanged"));
    }

    return Promise.reject(error);
  }
);

export { extractToken, refreshAccessToken };
export default api;
