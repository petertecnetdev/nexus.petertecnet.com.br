import api from "./api";
import { getEstablishmentCommerceOrders } from "./commerce";

jest.mock("./api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

jest.mock("../config", () => ({
  appSlug: "nexus",
  apiV1BaseUrl: "https://api.example.test/api/v1/apps/nexus",
}));

describe("received commerce orders", () => {
  beforeEach(() => {
    api.get.mockReset();
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
});
