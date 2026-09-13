import api from "./api";
import { apiV1BaseUrl } from "../config";

const CHECKOUT_PAYMENT_METHODS = new Set(["pix"]);

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
  if (!ordering?.available || !Array.isArray(ordering.payment_methods)) return false;
  // Checkout currently renders only the canonical `pix` identifier. Keep this
  // guard byte-for-byte aligned with the identifier the checkout can select.
  return ordering.payment_methods.some((method) => CHECKOUT_PAYMENT_METHODS.has(String(method || "")));
}
