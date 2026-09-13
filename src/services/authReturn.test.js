import { authReturnState, DEFAULT_AUTH_RETURN, sanitizeAuthReturn } from "./authReturn";

describe("auth return destination", () => {
  test("keeps an internal checkout destination", () => {
    expect(sanitizeAuthReturn("/checkout?source=catalog#payment")).toBe("/checkout?source=catalog#payment");
    expect(authReturnState("/checkout")).toEqual({ from: "/checkout" });
  });

  test("rejects external and protocol-relative destinations", () => {
    expect(sanitizeAuthReturn("https://example.com/checkout")).toBe(DEFAULT_AUTH_RETURN);
    expect(sanitizeAuthReturn("//example.com/checkout")).toBe(DEFAULT_AUTH_RETURN);
  });

  test("rejects auth entry loops", () => {
    expect(sanitizeAuthReturn("/login")).toBe(DEFAULT_AUTH_RETURN);
    expect(sanitizeAuthReturn("/register?from=checkout")).toBe(DEFAULT_AUTH_RETURN);
  });

  test("uses the configured fallback for invalid destinations", () => {
    expect(sanitizeAuthReturn(null, "/")).toBe("/");
  });
});
