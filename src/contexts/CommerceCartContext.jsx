import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import PropTypes from "prop-types";
import { appSlug } from "../config";

const STORAGE_KEY = `petertecnet_commerce_cart_${appSlug}`;

const emptyCart = { establishment: null, items: [] };

const readInitialCart = () => {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!value || !Array.isArray(value.items)) return emptyCart;
    return {
      establishment: value.establishment || null,
      items: value.items
        .filter((item) => item?.id)
        .map((item) => ({ ...item, quantity: Math.max(1, Number(item.quantity || 1)) })),
    };
  } catch {
    return emptyCart;
  }
};

const CommerceCartContext = createContext(null);

const normalizeEstablishment = (establishment) => establishment ? {
  id: Number(establishment.id),
  slug: establishment.slug,
  name: establishment.fantasy || establishment.name || "Estabelecimento",
  phone: establishment.phone || null,
  address: establishment.address || null,
  city: establishment.city || null,
  uf: establishment.uf || null,
} : null;

const normalizeItem = (item, quantity = 1) => ({
  id: Number(item.id),
  slug: item.slug,
  name: item.name,
  price: Number(item.price || 0),
  image_url: item.image_url || item.image || null,
  quantity: Math.max(1, Number(quantity || 1)),
});

export function CommerceCartProvider({ children }) {
  const [cart, setCart] = useState(readInitialCart);

  const persist = useCallback((next) => {
    setCart(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) { /* storage can be unavailable */ }
  }, []);

  const addItem = useCallback((item, establishment, quantity = 1) => {
    if (!item?.id || !establishment?.id) return { added: false, replaced: false };

    const targetEstablishment = normalizeEstablishment(establishment);
    let replaced = false;

    setCart((current) => {
      const sameEstablishment = Number(current.establishment?.id) === Number(targetEstablishment.id);
      const baseItems = sameEstablishment ? current.items : [];
      replaced = Boolean(current.establishment && !sameEstablishment && current.items.length);
      const existing = baseItems.find((entry) => Number(entry.id) === Number(item.id));
      const items = existing
        ? baseItems.map((entry) => Number(entry.id) === Number(item.id)
          ? { ...entry, quantity: entry.quantity + Math.max(1, Number(quantity || 1)) }
          : entry)
        : [...baseItems, normalizeItem(item, quantity)];
      const next = { establishment: targetEstablishment, items };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) { /* ignore */ }
      return next;
    });

    return { added: true, replaced };
  }, []);

  const buyNow = useCallback((item, establishment, quantity = 1) => {
    const next = {
      establishment: normalizeEstablishment(establishment),
      items: [normalizeItem(item, quantity)],
    };
    persist(next);
  }, [persist]);

  const setQuantity = useCallback((itemId, quantity) => {
    const nextQuantity = Math.max(1, Math.min(99, Number(quantity || 1)));
    setCart((current) => {
      const next = {
        ...current,
        items: current.items.map((entry) => Number(entry.id) === Number(itemId)
          ? { ...entry, quantity: nextQuantity }
          : entry),
      };
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) { /* ignore */ }
      return next;
    });
  }, []);

  const removeItem = useCallback((itemId) => {
    setCart((current) => {
      const items = current.items.filter((entry) => Number(entry.id) !== Number(itemId));
      const next = items.length ? { ...current, items } : emptyCart;
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch (_) { /* ignore */ }
      return next;
    });
  }, []);

  const clearCart = useCallback(() => persist(emptyCart), [persist]);

  const value = useMemo(() => ({
    ...cart,
    itemCount: cart.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0),
    subtotal: cart.items.reduce((sum, item) => sum + Number(item.price || 0) * Number(item.quantity || 0), 0),
    addItem,
    buyNow,
    setQuantity,
    removeItem,
    clearCart,
  }), [cart, addItem, buyNow, setQuantity, removeItem, clearCart]);

  return <CommerceCartContext.Provider value={value}>{children}</CommerceCartContext.Provider>;
}

CommerceCartProvider.propTypes = { children: PropTypes.node.isRequired };

export const useCommerceCart = () => {
  const context = useContext(CommerceCartContext);
  if (!context) throw new Error("useCommerceCart must be used inside CommerceCartProvider");
  return context;
};
