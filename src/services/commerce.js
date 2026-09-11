import api from "./api";
import { apiV1BaseUrl, appSlug } from "../config";

const base = `/v1/apps/${encodeURIComponent(appSlug)}/commerce`;

const requestConfig = (options = {}) => {
  const config = {};

  if (options?.background === true) {
    config.metadata = { background: true };
  }

  if (options?.background === true || options?.silent === true) {
    config.skipGlobalLoading = true;
  }

  return config;
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
  const randomPart =
    typeof window !== "undefined" && window.crypto?.randomUUID
      ? window.crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

  return `${appSlug}:${scope}:${randomPart}`;
};

const idempotencyConfig = (key, scope) => ({
  headers: {
    "Idempotency-Key": key || createCommerceIdempotencyKey(scope),
  },
});

const paymentRetryStorageKey = (publicId, paymentMethod) =>
  `${appSlug}:commerce:payment-retry:${publicId}:${paymentMethod}`;

const getPaymentRetryIdempotencyKey = (publicId, paymentMethod) => {
  const scope = `payment:${publicId}`;
  if (typeof window === "undefined" || !window.sessionStorage) {
    return createCommerceIdempotencyKey(scope);
  }

  const storageKey = paymentRetryStorageKey(publicId, paymentMethod);
  const existing = window.sessionStorage.getItem(storageKey);
  if (existing) return existing;

  const created = createCommerceIdempotencyKey(scope);
  window.sessionStorage.setItem(storageKey, created);
  return created;
};

const clearPaymentRetryIdempotencyKey = (publicId, paymentMethod) => {
  if (typeof window === "undefined" || !window.sessionStorage) return;
  window.sessionStorage.removeItem(paymentRetryStorageKey(publicId, paymentMethod));
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
  const { data } = await api.post(
    `${apiV1BaseUrl}/orders`,
    payload,
    idempotencyConfig(options?.idempotencyKey, "order")
  );
  return data?.data || null;
}

export async function retryCommercePayment(publicId, paymentMethod, options = {}) {
  const managedKey = !options?.idempotencyKey;
  const idempotencyKey = options?.idempotencyKey || getPaymentRetryIdempotencyKey(publicId, paymentMethod);

  try {
    const { data } = await api.post(
      `${base}/orders/${encodeURIComponent(publicId)}/payment`,
      { payment_method: paymentMethod },
      idempotencyConfig(idempotencyKey, `payment:${publicId}`)
    );

    if (managedKey) clearPaymentRetryIdempotencyKey(publicId, paymentMethod);
    return data?.data || null;
  } catch (error) {
    // A timeout, rate limit or 5xx does not prove that the provider failed to
    // create the payment. Reuse the same key so a user retry cannot create a
    // second charge after an ambiguous response.
    if (managedKey && isDefinitivePaymentRetryRejection(error)) {
      clearPaymentRetryIdempotencyKey(publicId, paymentMethod);
    }
    throw error;
  }
}

export async function getMyCommerceOrders(params = {}) {
  const { data } = await api.get(`${apiV1BaseUrl}/me/orders`, { params });
  return data?.data || null;
}

export async function getCommerceOrder(orderId, options = {}) {
  const { data } = await api.get(
    `${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`,
    requestConfig(options)
  );
  return data?.data || null;
}

export async function getCommercePayment(orderId, options = {}) {
  const config = requestConfig(options);
  const [{ data: paymentResponse }, { data: orderResponse }] = await Promise.all([
    api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/payment`, config),
    api.get(`${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}`, config),
  ]);

  return {
    order: orderResponse?.data || null,
    payment: paymentResponse?.data || null,
  };
}

export async function getCommerceFulfillmentCredential(orderId, options = {}) {
  const { data } = await api.get(
    `${apiV1BaseUrl}/me/orders/${encodeURIComponent(orderId)}/fulfillment/credential`,
    requestConfig(options)
  );
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
  const { data } = await api.patch(
    `${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/status`,
    { status }
  );
  return data?.data || null;
}

export async function getCommerceFulfillmentEvents(orderId, params = {}) {
  const { data } = await api.get(
    `${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/events`,
    { params }
  );
  return data?.data || [];
}

export async function verifyCommerceFulfillment(orderId, credential) {
  const { data } = await api.post(
    `${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/fulfillment/verify`,
    fulfillmentCredentialPayload(credential)
  );
  return data?.data || null;
}

export async function redeemCommerceOrder(orderId, credential) {
  const { data } = await api.post(
    `${apiV1BaseUrl}/orders/${encodeURIComponent(orderId)}/redeem`,
    fulfillmentCredentialPayload(credential)
  );
  return data;
}
