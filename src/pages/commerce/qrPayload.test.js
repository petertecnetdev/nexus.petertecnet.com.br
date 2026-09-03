import { parseCommerceClaimQr } from "./qrPayload";

describe("parseCommerceClaimQr", () => {
  test("extracts purchase id and token from the private URL fragment", () => {
    expect(parseCommerceClaimQr("https://nexus.petertecnet.com.br/redeem/order-123#token=abc%20123")).toEqual({
      publicId: "order-123",
      token: "abc 123",
    });
  });

  test("accepts relative fulfillment URLs", () => {
    expect(parseCommerceClaimQr("/redeem/550e8400-e29b-41d4-a716-446655440000#token=secure-token")).toEqual({
      publicId: "550e8400-e29b-41d4-a716-446655440000",
      token: "secure-token",
    });
  });

  test("keeps compatibility with legacy query-string QR codes", () => {
    expect(parseCommerceClaimQr("https://nexus.petertecnet.com.br/redeem/order-123?token=legacy-token")).toEqual({
      publicId: "order-123",
      token: "legacy-token",
    });
  });

  test("rejects unrelated or incomplete QR values", () => {
    expect(parseCommerceClaimQr("https://example.com/catalog/test")).toBeNull();
    expect(parseCommerceClaimQr("https://nexus.petertecnet.com.br/redeem/order-123")).toBeNull();
    expect(parseCommerceClaimQr("")).toBeNull();
  });
});
