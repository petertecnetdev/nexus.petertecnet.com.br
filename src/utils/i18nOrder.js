// src/utils/i18nOrder.js
const STATUS_MAP = {
  pending: "Pendente",
  paid: "Pago",
  canceled: "Cancelado",
  refunded: "Reembolsado",
};

const PAYMENT_STATUS_MAP = {
  pending: "Pendente",
  paid: "Pago",
  failed: "Falhou",
  refunded: "Reembolsado",
};

const TYPE_MAP = {
  appointment: "Agendamento",
  product: "Produto",
  service: "Serviço",
};

const ORIGIN_MAP = {
  app: "App",
  web: "Web",
  admin: "Painel",
};

export const i18nOrder = {
  status: (v) => STATUS_MAP[v] || v || "-",
  paymentStatus: (v) => PAYMENT_STATUS_MAP[v] || v || "-",
  type: (v) => TYPE_MAP[v] || v || "-",
  origin: (v) => ORIGIN_MAP[v] || v || "-",
};
