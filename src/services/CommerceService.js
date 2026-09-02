import api from "./api";
import { apiV1BaseUrl } from "../config";

const base = `${apiV1BaseUrl}/commerce`;

const unwrap = (response) => response?.data?.data ?? response?.data ?? null;

const normalizeError = (error, fallback) => {
  const message = error?.response?.data?.message || error?.message || fallback;
  const wrapped = new Error(message);
  wrapped.status = error?.response?.status;
  wrapped.details = error?.response?.data?.errors || null;
  return wrapped;
};

const call = async (promise, fallback) => {
  try { return unwrap(await promise); }
  catch (error) { throw normalizeError(error, fallback); }
};

const commerceService = {
  catalog: (slug) => call(
    api.get(`${base}/catalog/${encodeURIComponent(slug)}`),
    "Não foi possível preparar as opções de compra."
  ),

  checkout: (payload) => call(
    api.post(`${base}/orders`, payload),
    "Não foi possível criar a compra."
  ),

  myOrders: (params = {}) => call(
    api.get(`${base}/orders/mine`, { params }),
    "Não foi possível carregar suas compras."
  ),

  order: (publicId) => call(
    api.get(`${base}/orders/${encodeURIComponent(publicId)}`),
    "Não foi possível carregar esta compra."
  ),

  payment: (publicId) => call(
    api.get(`${base}/orders/${encodeURIComponent(publicId)}/payment`),
    "Não foi possível atualizar o pagamento."
  ),

  retryPayment: (publicId, paymentMethod) => call(
    api.post(`${base}/orders/${encodeURIComponent(publicId)}/payment`, { payment_method: paymentMethod }),
    "Não foi possível iniciar uma nova tentativa de pagamento."
  ),

  establishmentOrders: (establishmentId, params = {}) => call(
    api.get(`${base}/establishments/${Number(establishmentId)}/orders`, { params }),
    "Não foi possível carregar as compras do estabelecimento."
  ),

  updateStatus: (publicId, status) => call(
    api.patch(`${base}/orders/${encodeURIComponent(publicId)}/status`, { status }),
    "Não foi possível atualizar a compra."
  ),

  redeem: (publicId, token) => call(
    api.post(`${base}/orders/${encodeURIComponent(publicId)}/redeem`, { token }),
    "Não foi possível validar este QR Code."
  ),
};

export default commerceService;
