import { canStartPurchase } from "./ordering";

jest.mock("./api", () => ({ get: jest.fn(), patch: jest.fn() }));
jest.mock("../config", () => ({ apiV1BaseUrl: "https://api.example.test/api/v1/apps/nexus" }));

describe("ordering purchase readiness", () => {
  it("allows purchase when Pix is available", () => {
    expect(canStartPurchase({ available: true, payment_methods: ["pix"] })).toBe(true);
  });

  it("allows purchase when Pix is one of several generic methods", () => {
    expect(canStartPurchase({ available: true, payment_methods: ["cash", "PIX", "card_on_delivery"] })).toBe(true);
  });

  it("does not advertise a checkout that cannot complete the configured payment method", () => {
    expect(canStartPurchase({ available: true, payment_methods: ["cash", "card_on_delivery"] })).toBe(false);
  });

  it("does not start purchase when ordering is unavailable", () => {
    expect(canStartPurchase({ available: false, payment_methods: ["pix"] })).toBe(false);
  });
});
