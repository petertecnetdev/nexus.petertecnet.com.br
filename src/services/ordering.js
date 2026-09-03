import api from "./api";
import { apiV1BaseUrl } from "../config";

export async function getPublicOrdering(slug, options = {}) {
  const { data } = await api.get(
    `${apiV1BaseUrl}/establishments/${encodeURIComponent(slug)}/ordering`,
    options?.silent ? { skipGlobalLoading: true } : undefined
  );
  return data?.data || null;
}

export async function getOrderingSettings(establishmentId) {
  const { data } = await api.get(
    `${apiV1BaseUrl}/establishments/${encodeURIComponent(establishmentId)}/ordering-settings`
  );
  return data?.data || null;
}

export async function updateOrderingSettings(establishmentId, payload) {
  const { data } = await api.patch(
    `${apiV1BaseUrl}/establishments/${encodeURIComponent(establishmentId)}/ordering-settings`,
    payload
  );
  return data?.data || null;
}

export function canStartPurchase(ordering) {
  if (!ordering) return false;
  return Boolean(ordering.available) && Array.isArray(ordering.payment_methods) && ordering.payment_methods.length > 0;
}
