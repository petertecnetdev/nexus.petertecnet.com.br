const COMPLETE_FULFILLMENT_STATUSES = new Set(["fulfilled", "delivered"]);

export const isFulfillmentComplete = (status) =>
  COMPLETE_FULFILLMENT_STATUSES.has(String(status || "").toLowerCase());

export const getPurchaseQrPurpose = ({
  paymentStatus,
  paymentMethod,
  hasPaymentQr,
  hasClaimQr,
  fulfillmentStatus,
}) => {
  if (String(paymentStatus || "").toLowerCase() === "paid") {
    if (hasClaimQr && !isFulfillmentComplete(fulfillmentStatus)) return "fulfillment";
    return "none";
  }

  if (String(paymentMethod || "").toLowerCase() === "pix" && hasPaymentQr) {
    return "payment";
  }

  return "none";
};
