import api from "./api";
import {
  createCommerceOrder,
  getCommerceFulfillmentCredential,
  getCommerceFulfillmentEvents,
  getCommerceOrder,
  getCommercePayment,
  getEstablishmentCommerceOrders,
  getMyCommerceOrders,
  redeemCommerceOrder,
  retryCommercePayment,
  updateCommerceFulfillmentStatus,
  updateCommerceOrderStatus,
  verifyCommerceFulfillment,
} from "./commerce";

jest.mock("./api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

jest.mock("../config", () => ({
  appSlug: "nexus",
  apiV1BaseUrl: "https://api.example.test/api/v1/apps/nexus",
}));

describe("commerce order contracts", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.patch.mockReset();
    window.sessionStorage.clear();
  });

  it("uses the canonical generic checkout route with idempotency", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { order: { id: 123 } } } });
    await createCommerceOrder(
      { establishment_id: 8, payment_method: "pix", items: [{ item_id: 10, quantity: 1 }] },
      { idempotencyKey: "nexus:order:test-key" }
    );
    expect(api.post).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/orders",
      expect.objectContaining({ establishment_id: 8, payment_method: "pix" }),
      { headers: { "Idempotency-Key": "nexus:order:test-key" } }
    );
    expect(api.post.mock.calls[0][0]).not.toContain("/commerce/orders");
  });

  it("reuses the payment retry idempotency key after an ambiguous 5xx", async () => {
    api.post
      .mockRejectedValueOnce({ response: { status: 502 } })
      .mockResolvedValueOnce({ data: { data: { status: "pending" } } });

    await expect(retryCommercePayment("payment-123", "pix")).rejects.toEqual({ response: { status: 502 } });
    const firstKey = api.post.mock.calls[0][2].headers["Idempotency-Key"];

    await retryCommercePayment("payment-123", "pix");
    const secondKey = api.post.mock.calls[1][2].headers["Idempotency-Key"];

    expect(firstKey).toBeTruthy();
    expect(secondKey).toBe(firstKey);
  });

  it("routes Pix payment retries through the canonical generic order payment contract", async () => {
    api.post.mockResolvedValueOnce({ data: { data: { status: "pending" } } });

    const result = await retryCommercePayment("order-123", "pix", { idempotencyKey: "pix-retry-key" });

    expect(api.post).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/me/orders/order-123/payment",
      { payment_method: "pix" },
      { headers: { "Idempotency-Key": "pix-retry-key" } }
    );
    expect(api.post.mock.calls[0][0]).not.toContain("/commerce/orders/");
    expect(result).toEqual({ order: null, payment: { status: "pending" } });
  });

  it("uses the canonical generic establishment order route", async () => {
    api.get.mockResolvedValueOnce({ data: { data: { data: [] } } });
    await getEstablishmentCommerceOrders(8, { per_page: 100 });
    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/establishments/8/orders",
      { params: { per_page: 100 } }
    );
    expect(api.get.mock.calls[0][0]).not.toContain("/commerce/establishments/");
  });

  it("uses the canonical authenticated purchase history route", async () => {
    api.get.mockResolvedValueOnce({ data: { data: { data: [] } } });
    await getMyCommerceOrders({ per_page: 50 });
    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/me/orders",
      { params: { per_page: 50 } }
    );
    expect(api.get.mock.calls[0][0]).not.toContain("/commerce/orders/mine");
  });

  it("uses canonical order detail and payment status routes", async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: { id: 123, payment_status: "pending" } } })
      .mockResolvedValueOnce({ data: { data: { status: "pending" } } })
      .mockResolvedValueOnce({ data: { data: { id: 123, payment_status: "pending" } } });

    await getCommerceOrder(123, { silent: true });
    const result = await getCommercePayment(123, { background: true, silent: true });

    expect(api.get.mock.calls[0][0]).toBe("https://api.example.test/api/v1/apps/nexus/me/orders/123");
    expect(api.get.mock.calls[1][0]).toBe("https://api.example.test/api/v1/apps/nexus/me/orders/123/payment");
    expect(api.get.mock.calls[2][0]).toBe("https://api.example.test/api/v1/apps/nexus/me/orders/123");
    expect(api.get.mock.calls.every(([url]) => !url.includes("/commerce/orders/123"))).toBe(true);
    expect(result).toEqual({
      order: { id: 123, payment_status: "pending" },
      payment: { status: "pending" },
    });
  });

  it("uses canonical order fulfillment routes", async () => {
    api.get
      .mockResolvedValueOnce({ data: { data: { token: "abc" } } })
      .mockResolvedValueOnce({ data: { data: [] } });
    api.patch
      .mockResolvedValueOnce({ data: { data: { id: 123, status: "confirmed" } } })
      .mockResolvedValueOnce({ data: { data: { id: 123, fulfillment_status: "ready" } } });
    api.post
      .mockResolvedValueOnce({ data: { data: { valid: true } } })
      .mockResolvedValueOnce({ data: { success: true } });

    await getCommerceFulfillmentCredential(123, { silent: true });
    await updateCommerceOrderStatus(123, "confirmed");
    await updateCommerceFulfillmentStatus(123, "ready");
    await getCommerceFulfillmentEvents(123, { per_page: 20 });
    await verifyCommerceFulfillment(123, { token: "abc" });
    await redeemCommerceOrder(123, { code: "123456" });

    expect(api.get.mock.calls[0][0]).toBe("https://api.example.test/api/v1/apps/nexus/me/orders/123/fulfillment/credential");
    expect(api.patch.mock.calls[0][0]).toBe("https://api.example.test/api/v1/apps/nexus/orders/123/status");
    expect(api.patch.mock.calls[1][0]).toBe("https://api.example.test/api/v1/apps/nexus/orders/123/fulfillment/status");
    expect(api.get.mock.calls[1][0]).toBe("https://api.example.test/api/v1/apps/nexus/orders/123/fulfillment/events");
    expect(api.post.mock.calls[0][0]).toBe("https://api.example.test/api/v1/apps/nexus/orders/123/fulfillment/verify");
    expect(api.post.mock.calls[1][0]).toBe("https://api.example.test/api/v1/apps/nexus/orders/123/redeem");

    const allUrls = [...api.get.mock.calls, ...api.patch.mock.calls, ...api.post.mock.calls].map(([url]) => url);
    expect(allUrls.every((url) => !url.includes("/commerce/orders/123/fulfillment"))).toBe(true);
  });
});
