import { resolveImageUrl } from "./useImageUtils";

describe("resolveImageUrl", () => {
  const storageBase = "https://api.petertecnet.com.br/storage/";

  it("keeps absolute URLs untouched", () => {
    expect(
      resolveImageUrl("https://cdn.example.com/company/cover.jpg", storageBase)
    ).toBe("https://cdn.example.com/company/cover.jpg");
  });

  it("resolves a normal storage-relative path", () => {
    expect(resolveImageUrl("companies/cover.jpg", storageBase)).toBe(
      "https://api.petertecnet.com.br/storage/companies/cover.jpg"
    );
  });

  it("does not duplicate storage for Laravel storage paths", () => {
    expect(resolveImageUrl("storage/companies/cover.jpg", storageBase)).toBe(
      "https://api.petertecnet.com.br/storage/companies/cover.jpg"
    );
    expect(resolveImageUrl("/storage/companies/cover.jpg", storageBase)).toBe(
      "https://api.petertecnet.com.br/storage/companies/cover.jpg"
    );
  });

  it("resolves root-relative API media paths on the same origin", () => {
    expect(resolveImageUrl("/media/company/cover.jpg", storageBase)).toBe(
      "https://api.petertecnet.com.br/media/company/cover.jpg"
    );
  });

  it("returns null for empty values", () => {
    expect(resolveImageUrl(null, storageBase)).toBeNull();
    expect(resolveImageUrl("   ", storageBase)).toBeNull();
  });
});
