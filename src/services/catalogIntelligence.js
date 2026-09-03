import api from "./api";
import { apiV1BaseUrl } from "../config";

const base = `${apiV1BaseUrl}/catalog-intelligence`;

export const catalogIntelligence = {
  schema: (params = {}) => api.get(`${base}/schema`, { params }),
  resolve: (identity) => api.post(`${base}/resolve`, identity),
  item: (itemId) => api.get(`${base}/items/${encodeURIComponent(itemId)}`),
  enrichItem: (itemId, data) => api.post(`${base}/items/${encodeURIComponent(itemId)}/enrich`, data),
  health: (establishmentId) => api.get(`${base}/establishments/${encodeURIComponent(establishmentId)}/health`),
  stageImport: (payload) => api.post(`${base}/imports`, payload),
  getImport: (publicId) => api.get(`${base}/imports/${encodeURIComponent(publicId)}`),
  publishImport: (publicId, includeReview = false) => api.post(`${base}/imports/${encodeURIComponent(publicId)}/publish`, { include_review: includeReview }),
};

export default catalogIntelligence;
