import {
  apiBaseUrl,
  apiV1BaseUrl,
  apiV1BaseUrls,
  appId,
  appSlug,
  linkApp,
  storageUrl,
} from "./config";

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

  test("keeps the canonical app contract and numeric compatibility alias unique", () => {
    expect(apiV1BaseUrl).toContain(`/v1/apps/${encodeURIComponent(appSlug)}`);
    expect(apiV1BaseUrls[0]).toBe(apiV1BaseUrl);
    expect(new Set(apiV1BaseUrls).size).toBe(apiV1BaseUrls.length);
    expect(apiV1BaseUrls.every((url) => url.startsWith(`${apiBaseUrl}/v1/apps/`))).toBe(true);
  });
});
