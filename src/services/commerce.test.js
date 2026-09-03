import api from "./api";
import {
  createCommerceOrder,
  getCommerceCatalog,
  getEstablishmentCommerceOrders,
  getMyCommerceOrders,
  updateCommerceFulfillmentStatus,
} from "./commerce";

jest.mock("./api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

jest.mock("../config", () => ({
  apiV1BaseUrl: "https://api.example.test/api/v1/apps/nexus",
}));

describe("generic commerce API contract", () => {
  beforeEach(() => {
    api.get.mockReset();
    api.post.mockReset();
    api.patch.mockReset();
  });

  it("loads received orders from the canonical establishment route", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          data: [{ id: 42, status: "preparing", fulfillment: "pickup" }],
        },
      },
    });

    const result = await getEstablishmentCommerceOrders(8, { per_page: 100 });

    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/establishments/8/orders",
      { params: { per_page: 100 } }
    );
    expect(api.get.mock.calls[0][0]).not.toContain("/commerce/establishments/");
    expect(result.data[0]).toMatchObject({
      id: 42,
      public_id: "42",
      fulfillment_status: "preparing",
    });
  });

  it("uses canonical buyer and checkout routes", async () => {
    api.get.mockResolvedValueOnce({ data: { data: { data: [] } } });
    await getMyCommerceOrders({ per_page: 20 });
    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/me/orders",
      { params: { per_page: 20 } }
    );

    api.post.mockResolvedValueOnce({ data: { data: { order: { id: 9, status: "pending" } } } });
    const result = await createCommerceOrder({ payment_method: "pix" });
    expect(api.post).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/orders",
      { payment_method: "pix" }
    );
    expect(result.order.public_id).toBe("9");
  });

  it("adapts the canonical ordering payload for the current checkout UI", async () => {
    api.get.mockResolvedValueOnce({
      data: { data: { establishment: { id: 8 }, ordering: { available: true } } },
    });

    const result = await getCommerceCatalog("peter-tecnet");

    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/establishments/peter-tecnet/ordering"
    );
    expect(result.commerce).toEqual({ available: true });
  });

  it("keeps fulfillment on the generic numeric order contract", async () => {
    api.patch.mockResolvedValueOnce({
      data: { data: { id: 42, status: "ready", fulfillment: "pickup" } },
    });

    const result = await updateCommerceFulfillmentStatus(42, "ready");

    expect(api.patch).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/orders/42/fulfillment/status",
      { status: "ready" }
    );
    expect(result.fulfillment_status).toBe("ready");
  });
});
