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

const normalizeRecoverableOrder = (order) => {
  if (!order || !recoverablePaymentStatuses.has(String(order.payment_status || "").toLowerCase())) return order;
  return { ...order, payment_status: "failed" };
};

const fulfillmentCredentialPayload = (credential) => {
  if (credential && typeof credential === "object") {
    return {
      ...(credential.token ? { token: String(credential.token).trim() } : {}),
      ...(credential.code ? { code: String(credential.code).trim() } : {}),
    };
  }
  return { token: String(credential || "").trim() };
};

export const createCommerceIdempotencyKey = (scope = "commerce") => {
  const randomPart = typeof window !== "undefined" && window.crypto?.randomUUID
    ? window.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${appSlug}:${scope}:${randomPart}`;
};

const idempotencyConfig = (key, scope) => ({ headers: { "Idempotency-Key": key || createCommerceIdempotencyKey(scope) } });
const paymentRetryStorageKey = (orderId, paymentMethod) => `${appSlug}:commerce:payment-retry:${orderId}:${paymentMethod}`;

const getSessionStorage = () => {
  try { return typeof window !== "undefined" ? window.sessionStorage : null; } catch { return null; }
};

const getPaymentRetryIdempotencyKey = (orderId, paymentMethod) => {
  const scope = `payment:${orderId}`;
  const storageKey = paymentRetryStorageKey(orderId, paymentMethod);
  const storage = getSessionStorage();
  if (storage) {
    try {
      const existing = storage.getItem(storageKey);
      if (existing) { paymentRetryMemory.set(storageKey, existing); return existing; }
    } catch {}
  }
  const memoryKey = paymentRetryMemory.get(storageKey);
  if (memoryKey) return memoryKey;
  const created = createCommerceIdempotencyKey(scope);
  paymentRetryMemory.set(storageKey, created);
  if (storage) { try { storage.setItem(storageKey, created); } catch {} }
  return created;
};

const clearPaymentRetryIdempotencyKey = (orderId, paymentMethod) => {
  const storageKey = paymentRetryStorageKey(orderId, paymentMethod);
  paymentRetryMemory.delete(storageKey);
  const storage = getSessionStorage();
  if (!storage) return;
  try { storage.removeItem(storageKey); } catch {}
};

const isDefinitivePaymentRetryRejection = (error) => {
  const status = Number(error?.response?.status || 0);
  return status >= 400 && status < 500 && status !== 408 && status !== 425 && status !== 429;
};

export async function getCommerceCatalog(slug) {
  const { data } = await api.get(`${base}/catalog/${encodeURIComponent(slug)}`);
  return data?.data || null;
}

export async function createCommerceOrder(payload, options = {}) {
  const { data } = await api.post(`${apiV1BaseUrl}/orders`, payload, idempotencyConfig(options?.idempotencyKey, "order"));
  return data?.data || null;
}

export async function retryCommercePayment(orderId, paymentMethod, options = {}) {
  const managedKey = !options?.idempotencyKey;
  const idempotencyKey = options?.idempotencyKey || getPaymentRetryIdempotencyKey(orderId, paymentMethod);
  try {
    const endpoint = paymentMethod === "pix"
      ? `${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/payment`
      : `${base}/orders/${encodeURIComponent(orderId)}/payment`;
    const { data } = await api.post(endpoint, { payment_method: paymentMethod }, idempotencyConfig(idempotencyKey, `payment:${orderId}`));
    if (managedKey) clearPaymentRetryIdempotencyKey(orderId, paymentMethod);
    if (paymentMethod === "pix") return { order: null, payment: data?.data || null };
    return data?.data || null;
  } catch (error) {
    if (managedKey && isDefinitivePaymentRetryRejection(error)) clearPaymentRetryIdempotencyKey(orderId, paymentMethod);
    throw error;
  }
}

export async function getMyCommerceOrders(params = {}) {
  const { data } = await api.get(`${apiV1BaseUrl}/me/orders`, { params });
  return data?.data || null;
}

export async function getCommerceOrder(orderId, options = {}) {
  const { data } = await api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`, requestConfig(options));
  return normalizeRecoverableOrder(data?.data || null);
}

export async function getCommercePayment(orderId, options = {}) {
  const config = requestConfig(options);
  const [{ data: paymentResponse }, { data: orderResponse }] = await Promise.all([
    api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/payment`, config),
    api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`, config),
  ]);
  return { order: normalizeRecoverableOrder(orderResponse?.data || null), payment: paymentResponse?.data || null };
}

export async function getCommerceFulfillmentCredential(orderId, options = {}) {
  const { data } = await api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/fulfillment/credential`, requestConfig(options));
  return data?.data || null;
}

export async function getEstablishmentCommerceOrders(establishmentId, params = {}) {
  const { data } = await api.get(`${apiV1BaseUrl}/establishments/${establishmentId}/orders`, { params });
  return data?.data || null;
}

export async function updateCommerceOrderStatus(orderId, status) {
  const { data } = await api.patch(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/status`, { status });
  return data?.data || null;
}

export async function updateCommerceFulfillmentStatus(orderId, status) {
  const { data } = await api.patch(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/status`, { status });
  return data?.data || null;
}

export async function getCommerceFulfillmentEvents(orderId, params = {}) {
  const { data } = await api.get(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/events`, { params });
  return data?.data || [];
}

export async function verifyCommerceFulfillment(orderId, credential) {
  const { data } = await api.post(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/verify`, fulfillmentCredentialPayload(credential));
  return data?.data || null;
}

export async function redeemCommerceOrder(orderId, credential) {
  const { data } = await api.post(`${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/redeem`, fulfillmentCredentialPayload(credential));
  return data;
}
