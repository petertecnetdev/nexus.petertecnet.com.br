import api from "./api";
import { getFromApiV1, isApplicationContextUnavailable } from "./apiV1";

jest.mock("./api", () => ({
  get: jest.fn(),
}));

jest.mock("../config", () => ({
  apiV1BaseUrls: [
    "https://api.example.test/api/v1/apps/nexus",
    "https://api.example.test/api/v1/apps/2",
  ],
}));

describe("getFromApiV1", () => {
  beforeEach(() => {
    api.get.mockReset();
  });

  it("falls back to the numeric application context only when the slug context is unavailable", async () => {
    api.get
      .mockRejectedValueOnce({
        response: {
          status: 404,
          data: { code: "APPLICATION_NOT_AVAILABLE" },
        },
      })
      .mockResolvedValueOnce({ data: { success: true } });

    const response = await getFromApiV1("/directory");

    expect(api.get).toHaveBeenNthCalledWith(
      1,
      "https://api.example.test/api/v1/apps/nexus/directory",
      {}
    );
    expect(api.get).toHaveBeenNthCalledWith(
      2,
      "https://api.example.test/api/v1/apps/2/directory",
      {}
    );
    expect(response.data.success).toBe(true);
    expect(response.resolvedApiV1BaseUrl).toContain("/apps/2");
  });

  it("does not hide ordinary resource 404 errors", async () => {
    const error = { response: { status: 404, data: { code: "NOT_FOUND" } } };
    api.get.mockRejectedValueOnce(error);

    await expect(getFromApiV1("/catalog/missing")).rejects.toBe(error);
    expect(api.get).toHaveBeenCalledTimes(1);
  });
});

describe("isApplicationContextUnavailable", () => {
  it("matches only the generic application-context error", () => {
    expect(
      isApplicationContextUnavailable({
        response: {
          status: 404,
          data: { code: "APPLICATION_NOT_AVAILABLE" },
        },
      })
    ).toBe(true);

    expect(
      isApplicationContextUnavailable({
        response: { status: 404, data: { code: "NOT_FOUND" } },
      })
    ).toBe(false);
  });
});
