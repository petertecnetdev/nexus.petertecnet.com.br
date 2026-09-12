const CART_KEY = "nexus_commerce_cart_v1";
const EVENT_NAME = "nexus:cart-changed";
const OPEN_EVENT_NAME = "nexus:cart-open-requested";

let volatileCart = null;

function normalize(raw) {
  if (!raw || typeof raw !== "object") return null;
  const items = Array.isArray(raw.items) ? raw.items.filter((row) => row?.item?.id && Number(row.quantity) > 0) : [];
  if (!raw.establishment?.id || !items.length) return null;
  return { establishment: raw.establishment, items };
}

export function readCart() {
  try {
    const stored = normalize(JSON.parse(localStorage.getItem(CART_KEY) || "null"));
    if (stored) volatileCart = stored;
    return stored || volatileCart;
  } catch {
    return volatileCart;
  }
}

function writeCart(cart) {
  const normalized = normalize(cart);
  volatileCart = normalized;
  try {
    if (!normalized) localStorage.removeItem(CART_KEY);
    else localStorage.setItem(CART_KEY, JSON.stringify(normalized));
  } catch {
    // Storage may be unavailable in private mode, embedded WebViews or under
    // browser quota pressure. Keep the current session cart in memory instead
    // of breaking the purchase funnel.
  }
  window.dispatchEvent(new Event(EVENT_NAME));
  return normalized;
}

export function requestOpenCart() {
  window.dispatchEvent(new Event(OPEN_EVENT_NAME));
}

export function clearCart() {
  volatileCart = null;
  try { localStorage.removeItem(CART_KEY); } catch { /* keep checkout usable without persistent storage */ }
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
  const updated = writeCart(next);
  requestOpenCart();
  return updated;
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
export const CART_OPEN_EVENT = OPEN_EVENT_NAME;
