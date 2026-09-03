const COMPLETE_FULFILLMENT_STATUSES = new Set(["fulfilled", "delivered"]);
const TERMINAL_NON_PAYABLE_STATUSES = new Set(["refunded", "failed", "cancelled", "canceled"]);

export const isFulfillmentComplete = (status) =>
  COMPLETE_FULFILLMENT_STATUSES.has(String(status || "").toLowerCase());

export const getPurchaseQrPurpose = ({
  paymentStatus,
  paymentMethod,
  hasPaymentQr,
  hasClaimQr,
  fulfillmentStatus,
}) => {
  const normalizedPaymentStatus = String(paymentStatus || "").toLowerCase();

  if (normalizedPaymentStatus === "paid") {
    if (hasClaimQr && !isFulfillmentComplete(fulfillmentStatus)) return "fulfillment";
    return "none";
  }

  if (TERMINAL_NON_PAYABLE_STATUSES.has(normalizedPaymentStatus)) return "none";

  if (String(paymentMethod || "").toLowerCase() === "pix" && hasPaymentQr) {
    return "payment";
  }

  return "none";
};
