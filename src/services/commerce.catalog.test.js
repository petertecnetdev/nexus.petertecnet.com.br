import api from "./api";
import { getCommerceCatalog } from "./commerce";

jest.mock("./api", () => ({
  get: jest.fn(),
  post: jest.fn(),
  patch: jest.fn(),
}));

jest.mock("../config", () => ({
  appSlug: "nexus",
  apiV1BaseUrl: "https://api.example.test/api/v1/apps/nexus",
}));

describe("commerce ordering configuration contract", () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it("loads ordering configuration from the canonical generic establishment route", async () => {
    api.get.mockResolvedValueOnce({
      data: {
        data: {
          establishment: { id: 8, slug: "peter-tecnet" },
          items: [],
          ordering: {
            available: true,
            payment_methods: ["pix", "cash", "card_on_delivery"],
          },
        },
      },
    });

    const result = await getCommerceCatalog("peter-tecnet");

    expect(api.get).toHaveBeenCalledWith(
      "https://api.example.test/api/v1/apps/nexus/establishments/peter-tecnet/ordering"
    );
    expect(api.get.mock.calls[0][0]).not.toContain("/commerce/catalog/");
    expect(result.commerce).toEqual({
      available: true,
      payment_methods: ["pix", "cash", "card_on_delivery"],
    });
  });

  it("keeps the presentation adapter compatible when ordering is absent during rollout", async () => {
    api.get.mockResolvedValueOnce({
      data: { data: { commerce: { available: false, unavailable_reason: "closed" } } },
    });

    const result = await getCommerceCatalog("legacy-compatible");

    expect(result.commerce).toEqual({ available: false, unavailable_reason: "closed" });
  });
});
