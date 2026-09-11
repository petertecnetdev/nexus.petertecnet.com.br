import api from "./api";

const SESSION_KEY = "peter_public_experience_session";
const ATTRIBUTION_KEY = "peter_public_acquisition_attribution";
const ATTRIBUTION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const allowedTypes = new Set([
  "navigation",
  "click",
  "search",
  "filter",
  "scroll",
  "frontend_error",
  "frontend_checkout_recovery_notification_cta_viewed",
  "frontend_checkout_recovery_notification_cta_clicked",
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

const clean = (value, max = 160) => String(value || "").trim().slice(0, max);

const readAttribution = () => {
  if (typeof window === "undefined") return {};
  try {
    const stored = JSON.parse(window.localStorage.getItem(ATTRIBUTION_KEY) || "null");
    if (!stored || !stored.captured_at || Date.now() - Number(stored.captured_at) > ATTRIBUTION_TTL_MS) return {};
    return stored;
  } catch {
    return {};
  }
};

const captureAttribution = () => {
  if (typeof window === "undefined") return {};
  try {
    const params = new URLSearchParams(window.location.search);
    const source = clean(params.get("utm_source"));
    const medium = clean(params.get("utm_medium"));
    const campaign = clean(params.get("utm_campaign"));
    const content = clean(params.get("utm_content"));
    const term = clean(params.get("utm_term"));
    const qr = clean(params.get("qr") || params.get("qr_code") || params.get("source"));
    if (!source && !medium && !campaign && !content && !term && !qr) return readAttribution();

    const attribution = {
      utm_source: source || undefined,
      utm_medium: medium || undefined,
      utm_campaign: campaign || undefined,
      utm_content: content || undefined,
      utm_term: term || undefined,
      acquisition_source: qr || undefined,
      acquisition_landing: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
      captured_at: Date.now(),
    };
    window.localStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
    return attribution;
  } catch {
    return {};
  }
};

const attributionMetadata = () => {
  const attribution = captureAttribution();
  const { captured_at, ...metadata } = attribution;
  return captured_at ? { ...metadata, acquisition_captured_at: new Date(Number(captured_at)).toISOString() } : metadata;
};

const sanitizeMetadata = (metadata = {}) =>
  Object.fromEntries(
    Object.entries(metadata)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .slice(0, 30)
  );

export const getAcquisitionAttribution = () => sanitizeMetadata(attributionMetadata());

export const trackExperienceEvent = (type, label, target, metadata = {}) => {
  if (!allowedTypes.has(type) || typeof window === "undefined") return;

  const event = {
    id: randomId("experience"),
    type,
    timestamp: new Date().toISOString(),
    page: `${window.location.pathname}${window.location.search}`.slice(0, 1000),
    label: String(label || "").slice(0, 200) || undefined,
    target: String(target || "").slice(0, 200) || undefined,
    metadata: sanitizeMetadata({ ...attributionMetadata(), ...metadata }),
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
