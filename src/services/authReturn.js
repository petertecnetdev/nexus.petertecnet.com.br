export const DEFAULT_AUTH_RETURN = "/establishment/my";

const AUTH_ENTRY_PATH = /^\/(?:login|register)(?:[/?#]|$)/i;

export function sanitizeAuthReturn(value, fallback = DEFAULT_AUTH_RETURN) {
  const candidate = typeof value === "string" ? value.trim() : "";

  if (
    !candidate.startsWith("/") ||
    candidate.startsWith("//") ||
    AUTH_ENTRY_PATH.test(candidate)
  ) {
    return fallback;
  }

  return candidate;
}

export function currentAuthReturn() {
  if (typeof window === "undefined") return DEFAULT_AUTH_RETURN;

  return sanitizeAuthReturn(
    `${window.location.pathname || "/"}${window.location.search || ""}${window.location.hash || ""}`
  );
}

export function authReturnState(value) {
  return { from: sanitizeAuthReturn(value) };
}
