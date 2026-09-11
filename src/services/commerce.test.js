import api from "./api";
import {
  createCommerceOrder,
  getCommerceOrder,
  getCommercePayment,
  getEstablishmentCommerceOrders,
  getMyCommerceOrders,
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
});
