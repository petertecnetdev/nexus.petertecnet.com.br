import React, { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaCreditCard, FaMinus, FaPlus, FaQrcode, FaTrash } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import { createCommerceOrder, getCommerceCatalog } from "../../services/commerce";
import { clearCart, readCart, setCartItemQuantity } from "../../services/cart";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function CheckoutPage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [cart, setCart] = useState(() => readCart());
  const [commerce, setCommerce] = useState(null);
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    customer_name: `${user?.first_name || ""} ${user?.last_name || ""}`.trim(),
    customer_phone: user?.phone || "",
    fulfillment: "pickup",
    delivery_address: "",
    payment_method: "pix",
    notes: "",
  });

  useEffect(() => {
    let active = true;
    if (!cart?.establishment?.slug) {
      setLoadingConfig(false);
      return undefined;
    }
    getCommerceCatalog(cart.establishment.slug)
      .then((payload) => { if (active) setCommerce(payload?.commerce || null); })
      .catch((requestError) => { if (active) setError(requestError?.response?.data?.message || "Não foi possível carregar as opções de compra."); })
      .finally(() => { if (active) setLoadingConfig(false); });
    return () => { active = false; };
  }, [cart?.establishment?.slug]);

  const subtotal = useMemo(() => (cart?.items || []).reduce((sum, row) => sum + Number(row.item?.price || 0) * Number(row.quantity || 0), 0), [cart]);
  const deliveryFee = form.fulfillment === "delivery" ? Number(commerce?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;

  const changeQuantity = (itemId, next) => {
    const updated = setCartItemQuantity(itemId, next);
    setCart(updated);
  };

  const submit = async (event) => {
    event.preventDefault();
    if (!cart?.items?.length || processing) return;
    setError("");
    setProcessing(true);
    try {
      const result = await createCommerceOrder({
        establishment_id: cart.establishment.id,
        fulfillment: form.fulfillment,
        payment_method: form.payment_method,
        customer_name: form.customer_name,
        customer_phone: form.customer_phone || null,
        delivery_address: form.fulfillment === "delivery" ? form.delivery_address : null,
        notes: form.notes || null,
        items: cart.items.map((row) => ({ item_id: row.item.id, quantity: Number(row.quantity) })),
      });
      const order = result?.order;
      const payment = result?.payment;
      if (!order?.public_id) throw new Error("A API não retornou a identificação da compra.");

      sessionStorage.setItem(`nexus_payment_${order.public_id}`, JSON.stringify(payment || null));
      clearCart();

      if (form.payment_method === "card" && payment?.checkout_url) {
        window.location.assign(payment.checkout_url);
        return;
      }
      navigate(`/purchase/${order.public_id}`, { replace: true });
    } catch (requestError) {
      setError(requestError?.response?.data?.message || requestError?.message || "Não foi possível finalizar a compra.");
    } finally {
      setProcessing(false);
    }
  };

  if (!cart?.items?.length) {
    return <><GlobalNav /><Container className="commerce-shell"><Alert variant="info">Seu carrinho está vazio.</Alert><Button onClick={() => navigate("/")}>Explorar catálogos</Button></Container></>;
  }

  return (
    <div className="commerce-page">
      <GlobalNav />
      <Container className="commerce-shell">
        <div className="commerce-heading"><span>Checkout seguro</span><h1>Finalizar compra</h1><p>{cart.establishment.fantasy || cart.establishment.name}</p></div>
        {error && <Alert variant="danger">{error}</Alert>}

        <div className="commerce-grid">
          <section className="commerce-card">
            <h2>Seus itens</h2>
            {cart.items.map((row) => (
              <div className="cart-line" key={row.item.id}>
                <div><strong>{row.item.name}</strong><small>{money(row.item.price)} cada</small></div>
                <div className="cart-quantity">
                  <button type="button" onClick={() => changeQuantity(row.item.id, Number(row.quantity) - 1)} aria-label="Diminuir"><FaMinus /></button>
                  <span>{row.quantity}</span>
                  <button type="button" onClick={() => changeQuantity(row.item.id, Number(row.quantity) + 1)} aria-label="Aumentar"><FaPlus /></button>
                  <button type="button" className="danger" onClick={() => changeQuantity(row.item.id, 0)} aria-label="Remover"><FaTrash /></button>
                </div>
              </div>
            ))}
          </section>

          <Form className="commerce-card checkout-form" onSubmit={submit}>
            <h2>Entrega e pagamento</h2>
            <Form.Group className="mb-3"><Form.Label>Nome</Form.Label><Form.Control required value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Telefone</Form.Label><Form.Control value={form.customer_phone} onChange={(e) => setForm({ ...form, customer_phone: e.target.value })} /></Form.Group>

            <div className="choice-grid">
              {commerce?.fulfillment?.pickup !== false && <button type="button" className={form.fulfillment === "pickup" ? "choice active" : "choice"} onClick={() => setForm({ ...form, fulfillment: "pickup" })}>Retirar na loja</button>}
              {commerce?.fulfillment?.delivery !== false && <button type="button" className={form.fulfillment === "delivery" ? "choice active" : "choice"} onClick={() => setForm({ ...form, fulfillment: "delivery" })}>Pedir entrega</button>}
            </div>

            {form.fulfillment === "delivery" && <Form.Group className="mb-3"><Form.Label>Endereço de entrega</Form.Label><Form.Control as="textarea" rows={3} required value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} /></Form.Group>}

            <div className="choice-grid payment-choices">
              {(commerce?.payment_methods || ["pix", "card"]).includes("pix") && <button type="button" className={form.payment_method === "pix" ? "choice active" : "choice"} onClick={() => setForm({ ...form, payment_method: "pix" })}><FaQrcode /> Pix</button>}
              {(commerce?.payment_methods || ["pix", "card"]).includes("card") && <button type="button" className={form.payment_method === "card" ? "choice active" : "choice"} onClick={() => setForm({ ...form, payment_method: "card" })}><FaCreditCard /> Cartão</button>}
            </div>

            <Form.Group className="mb-3"><Form.Label>Observações</Form.Label><Form.Control as="textarea" rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Form.Group>

            <div className="order-summary"><span>Subtotal <strong>{money(subtotal)}</strong></span>{form.fulfillment === "delivery" && <span>Entrega <strong>{money(deliveryFee)}</strong></span>}<span className="total">Total <strong>{money(total)}</strong></span></div>
            <Button type="submit" className="w-100" disabled={processing || loadingConfig || commerce?.available === false}>{processing ? <><Spinner size="sm" /> Processando…</> : form.payment_method === "pix" ? "Gerar Pix" : "Pagar com cartão"}</Button>
            {commerce?.available === false && <small className="text-warning d-block mt-2">{commerce?.unavailable_reason || "Compras online indisponíveis."}</small>}
          </Form>
        </div>
      </Container>
    </div>
  );
}
