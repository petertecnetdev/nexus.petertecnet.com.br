import { addToCart, clearCart, readCart, reconcileCartWithCatalog, setCartItemQuantity } from "./cart";

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

  test("does not lose an existing item when quantity input is malformed", () => {
    addToCart({ id: 1, name: "Produto A", price: 10, status: 1 }, establishment, 2);

    const updated = setCartItemQuantity(1, "not-a-number");

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].quantity).toBe(2);
    expect(readCart().items[0].quantity).toBe(2);
  });

  test("normalizes malformed add quantities instead of dropping the purchase intent", () => {
    const updated = addToCart({ id: 1, name: "Produto A", price: 10, status: 1 }, establishment, "not-a-number");

    expect(updated.items).toHaveLength(1);
    expect(updated.items[0].quantity).toBe(1);
  });

  test("sanitizes persisted quantities before they reach checkout totals", () => {
    localStorage.setItem("nexus_commerce_cart_v1", JSON.stringify({
      establishment,
      items: [
        { item: { id: 1, name: "Produto A", price: 10, status: 1 }, quantity: 100000 },
        { item: { id: 2, name: "Produto B", price: 20, status: 1 }, quantity: 2.9 },
        { item: { id: 3, name: "Produto C", price: 30, status: 1 }, quantity: "invalid" },
      ],
    }));

    const restored = readCart();

    expect(restored.items).toHaveLength(2);
    expect(restored.items[0].quantity).toBe(99);
    expect(restored.items[1].quantity).toBe(2);
  });
});
