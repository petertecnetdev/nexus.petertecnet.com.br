import { getSessionStorageItem, setSessionStorageItem } from "./sessionStorageSafe";

describe("sessionStorageSafe", () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("returns null instead of throwing when sessionStorage reads are blocked", () => {
    jest.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(getSessionStorageItem("purchase")).toBeNull();
  });

  it("returns false instead of throwing when sessionStorage writes are blocked", () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new DOMException("Blocked", "SecurityError");
    });

    expect(setSessionStorageItem("purchase", "ok")).toBe(false);
  });
});
