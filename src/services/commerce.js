import api from "./api";
import { apiV1BaseUrl } from "../config";

const base = apiV1BaseUrl;

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

const fulfillmentStatus = (order) => {
  if (!order) return "pending";
  if (order.fulfillment_status) return String(order.fulfillment_status).toLowerCase();

  const status = String(order.status || "pending").toLowerCase();
  if (status === "completed") return order.fulfillment === "delivery" ? "delivered" : "fulfilled";
  return status;
};

const normalizeOrder = (order) => {
  if (!order || typeof order !== "object") return order;
  const id = order.id ?? order.public_id;

  return {
    ...order,
    id,
    // The current generic API uses numeric order ids. Keep this presentation
    // alias while the existing Nexus routes/components are migrated gradually.
    public_id: order.public_id || (id != null ? String(id) : ""),
    fulfillment_status: fulfillmentStatus(order),
  };
};

const normalizeOrderPage = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  return {
    ...payload,
    data: Array.isArray(payload.data) ? payload.data.map(normalizeOrder) : [],
  };
};

export async function getCommerceCatalog(slug) {
  const { data } = await api.get(`${base}/establishments/${encodeURIComponent(slug)}/ordering`);
  const payload = data?.data || null;
  if (!payload) return null;

  return {
    ...payload,
    // Compatibility presentation only: the API field is canonically `ordering`.
    commerce: payload.ordering || payload.commerce || null,
  };
}

export async function createCommerceOrder(payload) {
  const canonicalPayload = {
    ...payload,
    payment_method: payload?.payment_method === "card" ? "card_on_delivery" : payload?.payment_method,
  };
  const { data } = await api.post(`${base}/orders`, canonicalPayload);
  const result = data?.data || null;
  if (!result) return null;
  return { ...result, order: normalizeOrder(result.order) };
}

export async function retryCommercePayment(orderId, paymentMethod) {
  // The current generic API does not expose a duplicate order-specific payment
  // namespace. Keep retries on the canonical buyer-order contract.
  const method = paymentMethod === "card" ? "card_on_delivery" : paymentMethod;
  const { data } = await api.post(
    `${base}/me/orders/${encodeURIComponent(orderId)}/payment/retry`,
    { payment_method: method }
  );
  const result = data?.data || null;
  if (!result) return null;
  return { ...result, order: normalizeOrder(result.order) };
}

export async function getMyCommerceOrders(params = {}) {
  const { data } = await api.get(`${base}/me/orders`, { params });
  return normalizeOrderPage(data?.data || null);
}

export async function getCommerceOrder(orderId, options = {}) {
  const { data } = await api.get(
    `${base}/me/orders/${encodeURIComponent(orderId)}`,
    requestConfig(options)
  );
  return normalizeOrder(data?.data || null);
}

export async function getCommercePayment(orderId, options = {}) {
  const config = requestConfig(options);
  const [orderResponse, paymentResponse] = await Promise.all([
    api.get(`${base}/me/orders/${encodeURIComponent(orderId)}`, config),
    api.get(`${base}/me/orders/${encodeURIComponent(orderId)}/payment`, config),
  ]);

  return {
    order: normalizeOrder(orderResponse?.data?.data || null),
    payment: paymentResponse?.data?.data || null,
  };
}

export async function getCommerceFulfillmentCredential(orderId, options = {}) {
  const { data } = await api.get(
    `${base}/me/orders/${encodeURIComponent(orderId)}/fulfillment/credential`,
    requestConfig(options)
  );
  return data?.data || null;
}

export async function getEstablishmentCommerceOrders(establishmentId, params = {}) {
  const { data } = await api.get(`${base}/establishments/${establishmentId}/orders`, { params });
  return normalizeOrderPage(data?.data || null);
}

export async function updateCommerceOrderStatus(orderId, status) {
  const { data } = await api.patch(`${base}/orders/${encodeURIComponent(orderId)}/status`, { status });
  return normalizeOrder(data?.data || null);
}

export async function updateCommerceFulfillmentStatus(orderId, status) {
  const { data } = await api.patch(
    `${base}/orders/${encodeURIComponent(orderId)}/fulfillment/status`,
    { status }
  );
  return normalizeOrder(data?.data || null);
}

export async function getCommerceFulfillmentEvents(orderId, params = {}) {
  const { data } = await api.get(
    `${base}/orders/${encodeURIComponent(orderId)}/fulfillment/events`,
    { params }
  );
  return data?.data || [];
}

export async function verifyCommerceFulfillment(orderId, credential) {
  const { data } = await api.post(
    `${base}/orders/${encodeURIComponent(orderId)}/fulfillment/verify`,
    fulfillmentCredentialPayload(credential)
  );
  return normalizeOrder(data?.data || null);
}

export async function redeemCommerceOrder(orderId, credential) {
  const { data } = await api.post(
    `${base}/orders/${encodeURIComponent(orderId)}/redeem`,
    fulfillmentCredentialPayload(credential)
  );
  return { ...data, data: normalizeOrder(data?.data || null) };
}
