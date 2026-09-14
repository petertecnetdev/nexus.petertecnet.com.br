import api from "./api";
import { apiV1BaseUrl, appSlug } from "../config";

const base = `/v1/apps/${encodeURIComponent(appSlug)}/commerce`;
const paymentRetryMemory = new Map();
const recoverablePaymentStatuses = new Set(["rejected", "cancelled", "canceled"]);

const requestConfig = (options = {}) => {
  const config = {};
  if (options?.background === true) config.metadata = { background: true };
  if (options?.background === true || options?.silent === true) config.skipGlobalLoading = true;
  return config;
};

export const normalizeCommerceOrder = (order) => {
  if (!order) return order;
  const paymentStatus = String(order.payment_status || "").trim().toLowerCase();
  if (paymentStatus === "approved") return { ...order, payment_status: "paid" };
  if (recoverablePaymentStatuses.has(paymentStatus)) return { ...order, payment_status: "failed" };
  return order;
};

export const normalizeCommercePayment = (payment) => {
  if (!payment) return payment;
  const rawStatus = payment.payment_status ?? payment.status;
  const paymentStatus = String(rawStatus || "").trim().toLowerCase();
  const canonicalStatus = paymentStatus === "approved" ? "paid" : recoverablePaymentStatuses.has(paymentStatus) ? "failed" : paymentStatus;
  if (!canonicalStatus || canonicalStatus === paymentStatus) return payment;
  return { ...payment, ...(payment.payment_status != null ? { payment_status: canonicalStatus } : {}), ...(payment.status != null ? { status: canonicalStatus } : {}) };
};

const fulfillmentCredentialPayload = (credential) => {
  if (credential && typeof credential === "object") return { ...(credential.token ? { token: String(credential.token).trim() } : {}), ...(credential.code ? { code: String(credential.code).trim() } : {}) };
  return { token: String(credential || "").trim() };
};

export const createCommerceIdempotencyKey = (scope = "commerce") => {
  const randomPart = typeof window !== "undefined" && window.crypto?.randomUUID ? window.crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${appSlug}:${scope}:${randomPart}`;
};

const idempotencyConfig = (key, scope) => ({ headers: { "Idempotency-Key": key || createCommerceIdempotencyKey(scope) } });
const paymentRetryStorageKey = (orderId, paymentMethod) => `${appSlug}:commerce:payment-retry:${orderId}:${paymentMethod}`;
const getSessionStorage = () => { try { return typeof window !== "undefined" ? window.sessionStorage : null; } catch { return null; } };
const getPaymentRetryIdempotencyKey = (orderId, paymentMethod) => {
  const scope = `payment:${orderId}`; const storageKey = paymentRetryStorageKey(orderId, paymentMethod); const storage = getSessionStorage();
  if (storage) { try { const existing = storage.getItem(storageKey); if (existing) { paymentRetryMemory.set(storageKey, existing); return existing; } } catch {} }
  const memoryKey = paymentRetryMemory.get(storageKey); if (memoryKey) return memoryKey;
  const created = createCommerceIdempotencyKey(scope); paymentRetryMemory.set(storageKey, created); if (storage) { try { storage.setItem(storageKey, created); } catch {} } return created;
};
const clearPaymentRetryIdempotencyKey = (orderId, paymentMethod) => { const storageKey = paymentRetryStorageKey(orderId, paymentMethod); paymentRetryMemory.delete(storageKey); const storage = getSessionStorage(); if (!storage) return; try { storage.removeItem(storageKey); } catch {} };
const isDefinitivePaymentRetryRejection = (error) => { const status = Number(error?.response?.status || 0); return status >= 400 && status < 500 && status !== 408 && status !== 425 && status !== 429; };

export async function getCommerceCatalog(slug) { const { data } = await api.get(`${apiV1BaseUrl}/establishments/${encodeURIComponent(slug)}/ordering`); const payload = data?.data || null; if (!payload) return null; return { ...payload, commerce: payload.ordering || payload.commerce || null }; }
export async function createCommerceOrder(payload, options = {}) { const { data } = await api.post(`${apiV1BaseUrl}/orders`, payload, idempotencyConfig(options?.idempotencyKey, "order")); const result = data?.data || null; if (!result?.order) return result; return { ...result, order: normalizeCommerceOrder(result.order), payment: normalizeCommercePayment(result.payment) }; }

export async function retryCommercePayment(orderId, paymentMethod, options = {}) {
  const managedKey = !options?.idempotencyKey;
  const idempotencyKey = options?.idempotencyKey || getPaymentRetryIdempotencyKey(orderId, paymentMethod);
  try {
    const endpoint = paymentMethod === "pix" ? `${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/payment` : `${base}/orders/${encodeURIComponent(orderId)}/payment`;
    const { data } = await api.post(endpoint, { payment_method: paymentMethod }, idempotencyConfig(idempotencyKey, `payment:${orderId}`));
    if (managedKey) clearPaymentRetryIdempotencyKey(orderId, paymentMethod);
    if (paymentMethod === "pix") {
      const { data: orderResponse } = await api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`, requestConfig({ background: true, silent: true }));
      return { order: normalizeCommerceOrder(orderResponse?.data || null), payment: normalizeCommercePayment(data?.data || null) };
    }
    const result = data?.data || null; if (!result?.order) return result;
    return { ...result, order: normalizeCommerceOrder(result.order), payment: normalizeCommercePayment(result.payment) };
  } catch (error) { if (managedKey && isDefinitivePaymentRetryRejection(error)) clearPaymentRetryIdempotencyKey(orderId, paymentMethod); throw error; }
}

export async function getMyCommerceOrders(params = {}) { const { data } = await api.get(`${apiV1BaseUrl}/me/orders`, { params }); const payload = data?.data || null; if (Array.isArray(payload)) return payload.map(normalizeCommerceOrder); if (Array.isArray(payload?.data)) return { ...payload, data: payload.data.map(normalizeCommerceOrder) }; return payload; }
export async function getCommerceOrder(orderId, options = {}) { const { data } = await api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`, requestConfig(options)); return normalizeCommerceOrder(data?.data || null); }
export async function getCommercePayment(orderId, options = {}) { const config = requestConfig(options); const [{ data: paymentResponse }, { data: orderResponse }] = await Promise.all([api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/payment`, config), api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`, config)]); return { order: normalizeCommerceOrder(orderResponse?.data || null), payment: normalizeCommercePayment(paymentResponse?.data || null) }; }
export async function getCommerceFulfillmentCredential(orderId, options = {}) { const { data } = await api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/fulfillment/credential`, requestConfig(options)); return data?.data || null; }
export async function getEstablishmentCommerceOrders(establishmentId, params = {}) { const { data } = await api.get(`${apiV1BaseUrl}/establishments/${establishmentId}/orders`, { params }); const payload = data?.data || null; if (Array.isArray(payload)) return payload.map(normalizeCommerceOrder); if (Array.isArray(payload?.data)) return { ...payload, data: payload.data.map(normalizeCommerceOrder) }; return payload; }
export async function updateCommerceOrderStatus(orderId, status) { const { data } = await api.patch(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/status`, { status }); return normalizeCommerceOrder(data?.data || null); }
export async function updateCommerceFulfillmentStatus(orderId, status) { const { data } = await api.patch(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/status`, { status }); return normalizeCommerceOrder(data?.data || null); }
export async function getCommerceFulfillmentEvents(orderId, params = {}) { const { data } = await api.get(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/events`, { params }); return data?.data || []; }
export async function verifyCommerceFulfillment(orderId, credential) { const { data } = await api.post(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/verify`, fulfillmentCredentialPayload(credential)); return data?.data || null; }
export async function redeemCommerceOrder(orderId, credential) { const { data } = await api.post(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/redeem`, fulfillmentCredentialPayload(credential)); return data; }
