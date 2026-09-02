import React, { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { FaArrowLeft, FaCreditCard, FaMinus, FaPlus, FaShoppingBag } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import { Link, useNavigate } from "react-router-dom";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import EntityImage from "../../components/EntityImage";
import commerceService from "../../services/CommerceService";
import { useCommerceCart } from "../../contexts/CommerceCartContext";
import "./CommerceCheckoutPage.css";

const money = (value) => new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
}).format(Number(value || 0));

const displayName = (user) => [user?.first_name, user?.last_name].filter(Boolean).join(" ") || user?.name || "";

export default function CommerceCheckoutPage() {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const {
    establishment,
    items,
    subtotal,
    setQuantity,
    removeItem,
    clearCart,
  } = useCommerceCart();

  const [commerce, setCommerce] = useState(null);
  const [loading, setLoading] = useState(Boolean(establishment?.slug));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [customerName, setCustomerName] = useState(() => displayName(user));
  const [customerPhone, setCustomerPhone] = useState(user?.phone || user?.phone_number || "");
  const [fulfillment, setFulfillment] = useState("pickup");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("pix");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!establishment?.slug) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    setLoading(true);
    commerceService.catalog(establishment.slug)
      .then((data) => {
        if (!active) return;
        const config = data?.commerce || {};
        setCommerce(config);
        const fulfillmentOptions = config.fulfillment || {};
        if (!fulfillmentOptions.pickup && fulfillmentOptions.delivery) setFulfillment("delivery");
        const methods = Array.isArray(config.payment_methods) ? config.payment_methods : [];
        if (methods.length && !methods.includes("pix")) setPaymentMethod(methods[0]);
      })
      .catch((err) => active && setError(err?.message || "Não foi possível preparar o checkout."))
      .finally(() => active && setLoading(false));

    return () => { active = false; };
  }, [establishment?.slug]);

  const deliveryFee = fulfillment === "delivery" ? Number(commerce?.delivery_fee || 0) : 0;
  const total = subtotal + deliveryFee;
  const paymentMethods = useMemo(
    () => Array.isArray(commerce?.payment_methods) ? commerce.payment_methods : [],
    [commerce?.payment_methods]
  );

  const submit = async (event) => {
    event.preventDefault();
    if (!establishment?.id || !items.length) return;
    if (!customerName.trim()) {
      setError("Informe o nome de quem receberá a compra.");
      return;
    }
    if (fulfillment === "delivery" && !deliveryAddress.trim()) {
      setError("Informe o endereço de entrega.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const result = await commerceService.checkout({
        establishment_id: Number(establishment.id),
        fulfillment,
        payment_method: paymentMethod,
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim() || null,
        delivery_address: fulfillment === "delivery" ? deliveryAddress.trim() : null,
        notes: notes.trim() || null,
        items: items.map((item) => ({ item_id: Number(item.id), quantity: Number(item.quantity) })),
      });

      const publicId = result?.order?.public_id;
      if (!publicId) throw new Error("A API não retornou a identificação da compra.");

      try { sessionStorage.setItem(`commerce_checkout_${publicId}`, JSON.stringify(result)); } catch (_) { /* ignore */ }
      clearCart();

      if (paymentMethod === "card" && result?.payment?.checkout_url) {
        window.location.assign(result.payment.checkout_url);
        return;
      }

      navigate(`/purchase/${encodeURIComponent(publicId)}`, { state: { checkout: result } });
    } catch (err) {
      setError(err?.message || "Não foi possível concluir a compra.");
    } finally {
      setSubmitting(false);
    }
  };

  if (!establishment || !items.length) {
    return (
      <div className="commerce-page">
        <GlobalNav />
        <Container className="py-5">
          <div className="commerce-empty">
            <FaShoppingBag />
            <h1>Seu carrinho está vazio</h1>
            <p>Escolha um produto ou serviço em um catálogo da Nexus para iniciar uma compra.</p>
            <Button as={Link} to="/">Explorar a Nexus</Button>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="commerce-page">
      <GlobalNav />
      <Container className="commerce-checkout py-4 py-lg-5">
        <Link to={`/catalog/${encodeURIComponent(establishment.slug || "")}`} className="commerce-back">
          <FaArrowLeft /> Voltar ao catálogo
        </Link>

        <div className="commerce-heading">
          <span>Checkout seguro</span>
          <h1>Finalizar compra</h1>
          <p>Revise seus itens, escolha como deseja receber e pague por PIX ou cartão.</p>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}
        {loading && <div className="commerce-loading"><Spinner animation="border" /> Preparando as opções de pagamento…</div>}
        {!loading && commerce && !commerce.available && (
          <Alert variant="warning">{commerce.unavailable_reason || "As compras online estão temporariamente indisponíveis."}</Alert>
        )}

        <form onSubmit={submit} className="commerce-layout">
          <main className="commerce-main">
            <section className="commerce-panel">
              <div className="commerce-panel__head"><span>1</span><div><h2>Seu pedido</h2><p>{establishment.name}</p></div></div>
              <div className="commerce-cart-lines">
                {items.map((item) => (
                  <div className="commerce-cart-line" key={item.id}>
                    <EntityImage src={item.image_url} name={item.name} alt={item.name} className="commerce-cart-line__image" />
                    <div className="commerce-cart-line__copy">
                      <strong>{item.name}</strong>
                      <span>{money(item.price)} cada</span>
                      <button type="button" onClick={() => removeItem(item.id)}>Remover</button>
                    </div>
                    <div className="commerce-qty" aria-label={`Quantidade de ${item.name}`}>
                      <button type="button" aria-label="Diminuir" onClick={() => setQuantity(item.id, item.quantity - 1)}><FaMinus /></button>
                      <strong>{item.quantity}</strong>
                      <button type="button" aria-label="Aumentar" onClick={() => setQuantity(item.id, item.quantity + 1)}><FaPlus /></button>
                    </div>
                    <b>{money(item.price * item.quantity)}</b>
                  </div>
                ))}
              </div>
            </section>

            <section className="commerce-panel">
              <div className="commerce-panel__head"><span>2</span><div><h2>Recebimento</h2><p>Retire na loja ou solicite entrega quando disponível.</p></div></div>
              <div className="commerce-choice-grid">
                {commerce?.fulfillment?.pickup !== false && (
                  <label className={fulfillment === "pickup" ? "is-selected" : ""}>
                    <input type="radio" name="fulfillment" value="pickup" checked={fulfillment === "pickup"} onChange={() => setFulfillment("pickup")} />
                    <strong>Retirar no estabelecimento</strong><span>Apresente o QR Code da compra para receber seus itens.</span>
                  </label>
                )}
                {commerce?.fulfillment?.delivery && (
                  <label className={fulfillment === "delivery" ? "is-selected" : ""}>
                    <input type="radio" name="fulfillment" value="delivery" checked={fulfillment === "delivery"} onChange={() => setFulfillment("delivery")} />
                    <strong>Receber por entrega</strong><span>{deliveryFee > 0 ? `Taxa de ${money(deliveryFee)}` : "Entrega sem taxa adicional"}</span>
                  </label>
                )}
              </div>

              {fulfillment === "delivery" && (
                <Form.Group className="mt-3">
                  <Form.Label>Endereço de entrega</Form.Label>
                  <Form.Control as="textarea" rows={3} value={deliveryAddress} onChange={(event) => setDeliveryAddress(event.target.value)} placeholder="Rua, número, complemento, bairro e referência" required />
                </Form.Group>
              )}
            </section>

            <section className="commerce-panel">
              <div className="commerce-panel__head"><span>3</span><div><h2>Contato</h2><p>Dados usados pelo estabelecimento para identificar sua compra.</p></div></div>
              <div className="commerce-form-grid">
                <Form.Group><Form.Label>Nome</Form.Label><Form.Control value={customerName} onChange={(event) => setCustomerName(event.target.value)} required /></Form.Group>
                <Form.Group><Form.Label>Telefone</Form.Label><Form.Control value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} placeholder="(00) 00000-0000" /></Form.Group>
              </div>
              <Form.Group className="mt-3"><Form.Label>Observações</Form.Label><Form.Control as="textarea" rows={2} value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Alguma instrução para o vendedor?" /></Form.Group>
            </section>

            <section className="commerce-panel">
              <div className="commerce-panel__head"><span>4</span><div><h2>Pagamento</h2><p>O pagamento é processado pelo Mercado Pago.</p></div></div>
              <div className="commerce-payment-methods">
                {paymentMethods.includes("pix") && (
                  <button type="button" className={paymentMethod === "pix" ? "is-selected" : ""} onClick={() => setPaymentMethod("pix")}>
                    <SiPix /><span><strong>PIX</strong><small>QR Code e copia e cola</small></span>
                  </button>
                )}
                {paymentMethods.includes("card") && (
                  <button type="button" className={paymentMethod === "card" ? "is-selected" : ""} onClick={() => setPaymentMethod("card")}>
                    <FaCreditCard /><span><strong>Cartão</strong><small>Checkout protegido Mercado Pago</small></span>
                  </button>
                )}
              </div>
            </section>
          </main>

          <aside className="commerce-summary">
            <span>Resumo</span>
            <h2>{establishment.name}</h2>
            <div><span>Subtotal</span><strong>{money(subtotal)}</strong></div>
            {fulfillment === "delivery" && <div><span>Entrega</span><strong>{money(deliveryFee)}</strong></div>}
            <div className="commerce-summary__total"><span>Total</span><strong>{money(total)}</strong></div>
            <Button type="submit" disabled={submitting || loading || !commerce?.available || !paymentMethods.includes(paymentMethod)}>
              {submitting ? "Criando compra…" : paymentMethod === "pix" ? "Gerar PIX" : "Pagar com cartão"}
            </Button>
            <small>O QR Code de retirada/entrega só é liberado depois que o pagamento for confirmado.</small>
          </aside>
        </form>
      </Container>
    </div>
  );
}
