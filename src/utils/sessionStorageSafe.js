export const getSessionStorageItem = (key) => {
  try {
    return typeof window !== "undefined" ? window.sessionStorage?.getItem(key) ?? null : null;
  } catch {
    return null;
  }
};

export const setSessionStorageItem = (key, value) => {
  try {
    if (typeof window === "undefined" || !window.sessionStorage) return false;
    window.sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};
