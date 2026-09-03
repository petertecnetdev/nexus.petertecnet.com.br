const COMPLETE_FULFILLMENT_STATUSES = new Set(["fulfilled", "delivered"]);
const READY_FULFILLMENT_STATUSES = new Set(["ready", "available"]);
const PREPARING_FULFILLMENT_STATUSES = new Set(["preparing"]);
const TERMINAL_NON_PAYABLE_STATUSES = new Set(["refunded", "failed", "cancelled", "canceled"]);

const normalize = (value) => String(value || "").toLowerCase();

export const isFulfillmentComplete = (status) =>
  COMPLETE_FULFILLMENT_STATUSES.has(normalize(status));

export const isFulfillmentReady = (status) =>
  READY_FULFILLMENT_STATUSES.has(normalize(status));

export const isFulfillmentPreparing = (status) =>
  PREPARING_FULFILLMENT_STATUSES.has(normalize(status));

export const getPurchaseStage = ({ paymentStatus, fulfillmentStatus }) => {
  if (normalize(paymentStatus) !== "paid") return 0;
  if (isFulfillmentComplete(fulfillmentStatus)) return 3;
  if (isFulfillmentReady(fulfillmentStatus)) return 2;
  return 1;
};

export const getPurchaseQrPurpose = ({
  paymentStatus,
  paymentMethod,
  hasPaymentQr,
  hasClaimQr,
  fulfillmentStatus,
}) => {
  const normalizedPaymentStatus = normalize(paymentStatus);

  if (normalizedPaymentStatus === "paid") {
    if (hasClaimQr && isFulfillmentReady(fulfillmentStatus)) return "fulfillment";
    return "none";
  }

  if (TERMINAL_NON_PAYABLE_STATUSES.has(normalizedPaymentStatus)) return "none";

  if (normalize(paymentMethod) === "pix" && hasPaymentQr) {
    return "payment";
  }

  return "none";
};
