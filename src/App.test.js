import { apiBaseUrl, appId, linkApp, storageUrl } from "./config";

describe("Nexus runtime configuration", () => {
  test("uses a valid positive application id", () => {
    expect(Number.isInteger(appId)).toBe(true);
    expect(appId).toBeGreaterThan(0);
  });

  test("uses HTTPS production endpoints by default", () => {
    expect(apiBaseUrl).toMatch(/^https:\/\//);
    expect(storageUrl).toMatch(/^https:\/\//);
    expect(linkApp).toMatch(/^https:\/\//);
  });

  test("normalizes public and API URLs without duplicate trailing slashes", () => {
    expect(apiBaseUrl.endsWith("/")).toBe(false);
    expect(linkApp.endsWith("/")).toBe(false);
    expect(storageUrl.endsWith("/")).toBe(true);
  });
});
