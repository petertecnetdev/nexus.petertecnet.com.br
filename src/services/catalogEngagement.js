import api from "./api";
import { appId } from "../config";

const itemPath = (slug) =>
  `/v1/apps/${encodeURIComponent(appId)}/catalog-items/${encodeURIComponent(slug)}`;

export const trackCatalogEngagement = (slug, type, metadata = {}, label = null) => {
  if (!slug) return Promise.resolve();
  return api.post(`${itemPath(slug)}/engagement`, { type, label, metadata }, { timeout: 8000 })
    .catch(() => null);
};

export const submitCatalogInquiry = async ({ item, establishment, fields }) => {
  const payload = {
    name: String(fields.name || "").trim(),
    email: String(fields.email || "").trim() || null,
    phone: String(fields.phone || "").trim() || null,
    company: String(fields.company || "").trim() || null,
    need: item?.name || "Projeto digital",
    message: String(fields.message || "").trim() || null,
    service_slug: item?.slug || null,
    budget: String(fields.budget || "").trim() || null,
    urgency: String(fields.urgency || "").trim() || null,
    source: "nexus",
    source_url: typeof window !== "undefined" ? window.location.href : null,
    source_path: typeof window !== "undefined" ? window.location.pathname : null,
    establishment_id: establishment?.id || null,
  };

  const { data } = await api.post(
    `/v1/apps/${encodeURIComponent(appId)}/crm/inquiries`,
    payload,
    { timeout: 20000 }
  );
  return data;
};
