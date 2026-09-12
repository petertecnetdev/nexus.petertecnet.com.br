import { addToCart, clearCart, readCart, reconcileCartWithCatalog } from "./cart";

describe("commerce cart reconciliation", () => {
  const establishment = { id: 10, slug: "loja-teste", name: "Loja Teste" };

  beforeEach(() => {
    localStorage.clear();
    clearCart();
  });

  test("updates stale prices and removes unavailable items before checkout", () => {
    addToCart({ id: 1, name: "Produto A", price: 10, status: 1 }, establishment, 2);
    addToCart({ id: 2, name: "Produto B", price: 20, status: 1 }, establishment, 1);

    const result = reconcileCartWithCatalog(readCart(), [
      { id: 1, name: "Produto A", price: 12.5, status: 1 },
      { id: 2, name: "Produto B", price: 20, status: 0 },
    ]);

    expect(result.priceChangedCount).toBe(1);
    expect(result.removedCount).toBe(1);
    expect(result.changed).toBe(true);
    expect(result.cart.items).toHaveLength(1);
    expect(result.cart.items[0].item.price).toBe(12.5);
    expect(result.cart.items[0].quantity).toBe(2);
    expect(readCart()).toEqual(result.cart);
  });

  test("keeps the cart unchanged when the live catalog matches", () => {
    addToCart({ id: 1, name: "Produto A", price: 10, status: 1 }, establishment, 1);

    const result = reconcileCartWithCatalog(readCart(), [
      { id: 1, name: "Produto A", price: 10, status: 1 },
    ]);

    expect(result.priceChangedCount).toBe(0);
    expect(result.removedCount).toBe(0);
    expect(result.changed).toBe(false);
    expect(result.cart.items).toHaveLength(1);
  });
});
