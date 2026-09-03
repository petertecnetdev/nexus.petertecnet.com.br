import { getPurchaseQrPurpose, isFulfillmentComplete } from "./purchaseQrState";

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

  test("switches to the fulfillment QR after payment even if stale Pix data still exists", () => {
    expect(getPurchaseQrPurpose({
      paymentStatus: "paid",
      paymentMethod: "pix",
      hasPaymentQr: true,
      hasClaimQr: true,
      fulfillmentStatus: "pending",
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

  test("recognizes terminal fulfillment states", () => {
    expect(isFulfillmentComplete("fulfilled")).toBe(true);
    expect(isFulfillmentComplete("delivered")).toBe(true);
    expect(isFulfillmentComplete("pending")).toBe(false);
  });
});
