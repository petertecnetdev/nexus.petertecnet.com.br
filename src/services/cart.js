const CART_KEY = "nexus_commerce_cart_v1";
const EVENT_NAME = "nexus:cart-changed";

function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const items = Array.isArray(raw.items) ? raw.items.filter((row) => row?.item?.id && Number(row.quantity) > 0) : [];
  if (!raw.establishment?.id || !items.length) return null;
  return { establishment: raw.establishment, items };
}

export function readCart() {
  try {
    return normalize(JSON.parse(localStorage.getItem(CART_KEY) || "null"));
  } catch {
    return null;
  }
}

function writeCart(cart) {
  const normalized = normalize(cart);
  if (!normalized) localStorage.removeItem(CART_KEY);
  else localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  window.dispatchEvent(new Event(EVENT_NAME));
  return normalized;
}

export function clearCart() {
  localStorage.removeItem(CART_KEY);
  window.dispatchEvent(new Event(EVENT_NAME));
}

export function addToCart(item, establishment, quantity = 1) {
  if (!item?.id || !establishment?.id) return null;
  const current = readCart();
  const sameEstablishment = current && Number(current.establishment.id) === Number(establishment.id);
  const next = sameEstablishment ? { ...current, items: [...current.items] } : { establishment, items: [] };
  const index = next.items.findIndex((row) => Number(row.item.id) === Number(item.id));
  if (index >= 0) next.items[index] = { ...next.items[index], quantity: Math.min(99, Number(next.items[index].quantity || 0) + Number(quantity || 1)) };
  else next.items.push({ item, quantity: Math.min(99, Math.max(1, Number(quantity || 1))) });
  return writeCart(next);
}

export function setCartItemQuantity(itemId, quantity) {
  const current = readCart();
  if (!current) return null;
  const amount = Math.max(0, Math.min(99, Number(quantity || 0)));
  const items = current.items
    .map((row) => Number(row.item.id) === Number(itemId) ? { ...row, quantity: amount } : row)
    .filter((row) => row.quantity > 0);
  return writeCart({ ...current, items });
}

export function cartCount() {
  return (readCart()?.items || []).reduce((sum, row) => sum + Number(row.quantity || 0), 0);
}

export const CART_EVENT = EVENT_NAME;
