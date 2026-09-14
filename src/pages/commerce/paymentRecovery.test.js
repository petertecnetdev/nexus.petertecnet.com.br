import { isConfirmedPaymentStatus, isRetryablePaymentStatus, isTerminalPaymentStatus } from "./paymentRecovery";

describe("payment recovery", () => {
  test.each(["paid", "PAID", " approved "])("treats %s as confirmed", (status) => {
    expect(isConfirmedPaymentStatus(status)).toBe(true);
  });

  test.each([undefined, null, "", "pending", "processing", "failed", "rejected"])("does not treat %s as confirmed", (status) => {
    expect(isConfirmedPaymentStatus(status)).toBe(false);
  });

  test.each(["failed", "REJECTED", " cancelled ", "canceled"])("keeps %s retryable", (status) => {
    expect(isRetryablePaymentStatus(status)).toBe(true);
  });

  test.each(["refunded", "failed", "REJECTED", " cancelled ", "canceled"])("treats %s as terminal", (status) => {
    expect(isTerminalPaymentStatus(status)).toBe(true);
  });

  test.each([undefined, null, "", "pending", "processing", "paid", "approved"])("does not treat %s as terminal", (status) => {
    expect(isTerminalPaymentStatus(status)).toBe(false);
  });
});
