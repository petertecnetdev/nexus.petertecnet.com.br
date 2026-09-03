import api from "./api";
import { appSlug } from "../config";

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

export async function getCommerceCatalog(slug) {
  const { data } = await api.get(`${base}/catalog/${encodeURIComponent(slug)}`);
  return data?.data || null;
}

export async function createCommerceOrder(payload) {
  const { data } = await api.post(`${base}/orders`, payload);
  return data?.data || null;
}

export async function retryCommercePayment(publicId, paymentMethod) {
  const { data } = await api.post(`${base}/orders/${encodeURIComponent(publicId)}/payment`, {
    payment_method: paymentMethod,
  });
  return data?.data || null;
}

export async function getMyCommerceOrders(params = {}) {
  const { data } = await api.get(`${base}/orders/mine`, { params });
  return data?.data || null;
}

export async function getCommerceOrder(publicId, options = {}) {
  const { data } = await api.get(
    `${base}/orders/${encodeURIComponent(publicId)}`,
    requestConfig(options)
  );
  return data?.data || null;
}

export async function getCommercePayment(publicId, options = {}) {
  const { data } = await api.get(
    `${base}/orders/${encodeURIComponent(publicId)}/payment`,
    requestConfig(options)
  );
  return data?.data || null;
}

export async function getCommerceFulfillmentCredential(publicId, options = {}) {
  const { data } = await api.get(
    `${base}/orders/${encodeURIComponent(publicId)}/fulfillment/credential`,
    requestConfig(options)
  );
  return data?.data || null;
}

export async function getEstablishmentCommerceOrders(establishmentId, params = {}) {
  const { data } = await api.get(`${base}/establishments/${establishmentId}/orders`, { params });
  return data?.data || null;
}

export async function updateCommerceOrderStatus(publicId, status) {
  const { data } = await api.patch(`${base}/orders/${encodeURIComponent(publicId)}/status`, { status });
  return data?.data || null;
}

export async function updateCommerceFulfillmentStatus(publicId, status) {
  const { data } = await api.patch(
    `${base}/orders/${encodeURIComponent(publicId)}/fulfillment/status`,
    { status }
  );
  return data?.data || null;
}

export async function getCommerceFulfillmentEvents(publicId, params = {}) {
  const { data } = await api.get(
    `${base}/orders/${encodeURIComponent(publicId)}/fulfillment/events`,
    { params }
  );
  return data?.data || [];
}

export async function verifyCommerceFulfillment(publicId, credential) {
  const { data } = await api.post(
    `${base}/orders/${encodeURIComponent(publicId)}/fulfillment/verify`,
    fulfillmentCredentialPayload(credential)
  );
  return data?.data || null;
}

export async function redeemCommerceOrder(publicId, credential) {
  const { data } = await api.post(
    `${base}/orders/${encodeURIComponent(publicId)}/redeem`,
    fulfillmentCredentialPayload(credential)
  );
  return data;
}
