export const RETRYABLE_PAYMENT_STATUSES = new Set([
  "failed",
  "rejected",
  "cancelled",
  "canceled",
]);

export const TERMINAL_PAYMENT_STATUSES = new Set([
  "refunded",
  ...RETRYABLE_PAYMENT_STATUSES,
]);

export const CONFIRMED_PAYMENT_STATUSES = new Set([
  "paid",
  "approved",
]);

export const normalizePaymentStatus = (status) =>
  String(status || "").trim().toLowerCase();

export const isRetryablePaymentStatus = (status) =>
  RETRYABLE_PAYMENT_STATUSES.has(normalizePaymentStatus(status));

export const isTerminalPaymentStatus = (status) =>
  TERMINAL_PAYMENT_STATUSES.has(normalizePaymentStatus(status));

export const isConfirmedPaymentStatus = (status) =>
  CONFIRMED_PAYMENT_STATUSES.has(normalizePaymentStatus(status));
