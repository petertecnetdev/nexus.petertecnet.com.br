import {
  getPurchaseQrPurpose,
  getPurchaseStage,
  isFulfillmentComplete,
  isFulfillmentPreparing,
  isFulfillmentReady,
} from "./purchaseQrState";

describe("purchase QR purpose", () => {
  test("shows the Pix payment QR while payment is pending", () => {
    expect(getPurchaseQrPurpose({
      paymentStatus: "pending",
      paymentMethod: "pix",
      hasPaymentQr: true,
      hasClaimQr: false,
      fulfillmentStatus: "pending",
    })).toBe("payment");
  });

  test("does not expose the pickup QR while a paid order is preparing", () => {
    expect(getPurchaseQrPurpose({
      paymentStatus: "paid",
      paymentMethod: "pix",
      hasPaymentQr: true,
      hasClaimQr: true,
      fulfillmentStatus: "preparing",
    })).toBe("none");
  });

  test.each(["ready", "available"])("shows fulfillment QR only when status is %s", (fulfillmentStatus) => {
    expect(getPurchaseQrPurpose({
      paymentStatus: "paid",
      paymentMethod: "pix",
      hasPaymentQr: true,
      hasClaimQr: true,
      fulfillmentStatus,
    })).toBe("fulfillment");
  });

  test("does not keep showing a fulfillment QR after it has already been used", () => {
    expect(getPurchaseQrPurpose({
      paymentStatus: "paid",
      paymentMethod: "pix",
      hasPaymentQr: true,
      hasClaimQr: true,
      fulfillmentStatus: "fulfilled",
    })).toBe("none");
  });

  test.each(["failed", "refunded", "cancelled", "canceled"])(
    "does not show a stale Pix QR when payment is %s",
    (paymentStatus) => {
      expect(getPurchaseQrPurpose({
        paymentStatus,
        paymentMethod: "pix",
        hasPaymentQr: true,
        hasClaimQr: false,
        fulfillmentStatus: "pending",
      })).toBe("none");
    },
  );

  test("recognizes lifecycle stages", () => {
    expect(getPurchaseStage({ paymentStatus: "pending", fulfillmentStatus: "pending" })).toBe(0);
    expect(getPurchaseStage({ paymentStatus: "paid", fulfillmentStatus: "preparing" })).toBe(1);
    expect(getPurchaseStage({ paymentStatus: "paid", fulfillmentStatus: "ready" })).toBe(2);
    expect(getPurchaseStage({ paymentStatus: "paid", fulfillmentStatus: "fulfilled" })).toBe(3);
    expect(isFulfillmentPreparing("preparing")).toBe(true);
    expect(isFulfillmentReady("available")).toBe(true);
    expect(isFulfillmentComplete("delivered")).toBe(true);
  });
});
