import api from "./api";

const SESSION_KEY = "peter_public_experience_session";
const allowedTypes = new Set([
  "navigation",
  "click",
  "search",
  "filter",
  "scroll",
  "frontend_error",
]);

const randomId = (prefix) => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
};

const sessionId = () => {
  if (typeof window === "undefined") return randomId("server");
  try {
    const stored = window.sessionStorage.getItem(SESSION_KEY);
    if (stored) return stored;
    const created = randomId("session");
    window.sessionStorage.setItem(SESSION_KEY, created);
    return created;
  } catch {
    return randomId("session");
  }
};

const sanitizeMetadata = (metadata = {}) =>
  Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .slice(0, 30)
  );

export const trackExperienceEvent = (type, label, target, metadata = {}) => {
  if (!allowedTypes.has(type) || typeof window === "undefined") return;

  const event = {
    id: randomId("experience"),
    type,
    timestamp: new Date().toISOString(),
    page: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
    label: String(label || "").slice(0, 200) || undefined,
    target: String(target || "").slice(0, 200) || undefined,
    metadata: sanitizeMetadata(metadata),
  };

  api
    .post(
      "/interactions/batch",
      {
        session_id: sessionId(),
        events: [event],
      },
      {
        headers: { "X-Telemetry-Schema": "1" },
        timeout: 8000,
      }
    )
    .catch(() => {
      // Telemetry must never block the public experience.
    });
};

export default trackExperienceEvent;
