export const RETRYABLE_PAYMENT_STATUSES = new Set([
  "failed",
  "rejected",
  "cancelled",
  "canceled",
]);

export const isRetryablePaymentStatus = (status) =>
  RETRYABLE_PAYMENT_STATUSES.has(String(status || "").trim().toLowerCase());
