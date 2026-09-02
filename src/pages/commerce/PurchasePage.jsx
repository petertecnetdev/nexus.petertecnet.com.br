import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { FaCheckCircle, FaCopy, FaCreditCard, FaReceipt, FaRedo, FaTruck } from "react-icons/fa";
import { SiPix } from "react-icons/si";
import { Link, useLocation, useParams } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import LocalQrCode from "../../components/LocalQrCode";
import commerceService from "../../services/CommerceService";
import { linkApp } from "../../config";
import "./PurchasePage.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));
const terminalPaymentStatuses = ["paid", "refunded", "failed", "cancelled", "charged_back"];

const readStored = (publicId) => {
  try { return JSON.parse(sessionStorage.getItem(`commerce_checkout_${publicId}`) || "null"); }
  catch { return null; }
};

export default function PurchasePage() {
  const { publicId } = useParams();
  const location = useLocation();
  const initial = location.state?.checkout || readStored(publicId);
  const [data, setData] = useState(initial);
  const [loading, setLoading] = useState(!initial);
  const [syncing, setSyncing] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const dataRef = useRef(data);
  dataRef.current = data;

  const persist = useCallback((next) => {
    setData(next);
    try { sessionStorage.setItem(`commerce_checkout_${publicId}`, JSON.stringify(next)); } catch (_) { /* ignore */ }
  }, [publicId]);

  const mergeRemote = useCallback((remote) => {
    if (!remote) return;
    const current = dataRef.current || {};
    const merged = {
      ...current,
      ...remote,
      order: remote.order || current.order,
      payment: { ...(current.payment || {}), ...(remote.payment || {}) },
    };
    persist(merged);
  }, [persist]);

  const sync = useCallback(async ({ manual = false } = {}) => {
    if (!publicId) return;
    if (manual) setSyncing(true);
    try {
      const remote = await commerceService.payment(publicId);
      mergeRemote(remote);
      setError("");
    } catch (err) {
      setError(err?.message || "Não foi possível atualizar o pagamento.");
    } finally {
      setLoading(false);
      if (manual) setSyncing(false);
    }
  }, [mergeRemote, publicId]);

  useEffect(() => {
    sync();
  }, [sync]);

  const paymentStatus = data?.order?.payment_status || data?.payment?.status || "pending";
  const fulfilled = ["fulfilled", "delivered"].includes(data?.order?.fulfillment_status);

  useEffect(() => {
    if (!publicId || terminalPaymentStatuses.includes(paymentStatus)) return undefined;
    let active = true;
    let busy = false;
    const tick = async () => {
      if (!active || busy || document.visibilityState === "hidden") return;
      busy = true;
      try { await sync(); } finally { busy = false; }
    };
    const timer = window.setInterval(tick, 5000);
    const onFocus = () => tick();
    window.addEventListener("focus", onFocus);
    return () => { active = false; window.clearInterval(timer); window.removeEventListener("focus", onFocus); };
  }, [paymentStatus, publicId, sync]);

  const order = data?.order;
  const payment = data?.payment;
  const claim = order?.claim;
  const redeemUrl = useMemo(() => claim?.token && order?.public_id
    ? `${linkApp}/purchase/redeem/${encodeURIComponent(order.public_id)}?token=${encodeURIComponent(claim.token)}`
    : "", [claim?.token, order?.public_id]);

  const copyPix = async () => {
    if (!payment?.qr_code) return;
    try { await navigator.clipboard.writeText(payment.qr_code); } catch { window.prompt("Copie o código PIX:", payment.qr_code); }
  };

  const retry = async (method) => {
    setRetrying(true);
    setError("");
    try {
      const next = await commerceService.retryPayment(publicId, method);
      mergeRemote(next);
      if (method === "card" && next?.payment?.checkout_url) window.location.assign(next.payment.checkout_url);
    } catch (err) {
      setError(err?.message || "Não foi possível iniciar outro pagamento.");
    } finally {
      setRetrying(false);
    }
  };

  if (loading && !order) {
    return <div className="purchase-page"><GlobalNav /><div className="purchase-loading"><Spinner animation="border" /><span>Carregando sua compra…</span></div></div>;
  }

  if (!order) {
    return <div className="purchase-page"><GlobalNav /><Container className="py-5"><Alert variant="danger">{error || "Compra não encontrada."}</Alert><Button as={Link} to="/purchases">Ver minhas compras</Button></Container></div>;
  }

  return (
    <div className="purchase-page">
      <GlobalNav />
      <Container className="purchase-shell py-4 py-lg-5">
        <div className="purchase-topline"><span>Compra #{order.order_number}</span><Link to="/purchases">Minhas compras</Link></div>
        {error && <Alert variant="danger">{error}</Alert>}

        {paymentStatus === "paid" ? (
          <section className="purchase-success">
            <div className="purchase-success__icon"><FaCheckCircle /></div>
            <span>Pagamento confirmado</span>
            <h1>{fulfilled ? "Pedido já entregue" : "Sua compra está liberada"}</h1>
            <p>{fulfilled
              ? "Este QR Code já foi validado pelo estabelecimento e a entrega desta compra foi concluída."
              : order.fulfillment === "delivery"
                ? "Mostre este QR Code ao vendedor ou entregador. Ele confirma que a compra está paga e autoriza a entrega."
                : "Apresente este QR Code no estabelecimento para retirar os itens da compra."}</p>

            {!fulfilled && redeemUrl && (
              <div className="purchase-claim">
                <LocalQrCode value={redeemUrl} title={`compra-${order.order_number}`} size={280} />
                <div><strong>QR Code da compra</strong><small>É diferente do QR Code do PIX. Este código representa o direito de receber os itens e só é liberado após o pagamento.</small></div>
              </div>
            )}
          </section>
        ) : (
          <section className="purchase-payment">
            <div className="purchase-payment__head">
              <div>{payment?.method === "card" ? <FaCreditCard /> : <SiPix />}</div>
              <div><span>Pagamento pendente</span><h1>{payment?.method === "card" ? "Conclua o pagamento com cartão" : "Pague sua compra por PIX"}</h1></div>
            </div>

            {payment?.method === "pix" && payment?.qr_code_base64 && (
              <img className="purchase-pix-image" src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code PIX" />
            )}
            {payment?.method === "pix" && payment?.qr_code && (
              <div className="purchase-pix-code"><code>{payment.qr_code}</code><Button variant="outline-light" onClick={copyPix}><FaCopy /> Copiar PIX</Button></div>
            )}
            {payment?.method === "card" && payment?.checkout_url && (
              <Button className="purchase-primary" onClick={() => window.location.assign(payment.checkout_url)}><FaCreditCard /> Abrir pagamento seguro</Button>
            )}

            {!payment?.qr_code && payment?.method === "pix" && (
              <Alert variant="info">O QR Code PIX desta tentativa não está disponível nesta sessão. Você pode verificar a confirmação ou gerar uma nova tentativa.</Alert>
            )}

            <div className="purchase-payment__actions">
              <Button className="purchase-primary" onClick={() => sync({ manual: true })} disabled={syncing}><FaRedo /> {syncing ? "Verificando…" : "Já paguei — verificar"}</Button>
              {paymentStatus === "failed" && <Button variant="outline-light" disabled={retrying} onClick={() => retry(order.payment_method || "pix")}>Tentar novamente</Button>}
            </div>
          </section>
        )}

        <div className="purchase-layout">
          <section className="purchase-card">
            <div className="purchase-card__title"><FaReceipt /><div><span>Resumo da compra</span><h2>{order.establishment?.fantasy || order.establishment?.name}</h2></div></div>
            <div className="purchase-lines">{(order.items || []).map((item) => <div key={item.item_id}><span>{item.quantity}× {item.name}</span><strong>{money(item.subtotal)}</strong></div>)}</div>
            <div className="purchase-totals"><div><span>Subtotal</span><strong>{money(order.subtotal)}</strong></div>{Number(order.delivery_fee || 0) > 0 && <div><span>Entrega</span><strong>{money(order.delivery_fee)}</strong></div>}<div className="purchase-total"><span>Total</span><strong>{money(order.total_price)}</strong></div></div>
          </section>

          <section className="purchase-card">
            <div className="purchase-card__title"><FaTruck /><div><span>Recebimento</span><h2>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</h2></div></div>
            {order.delivery_address && <p>{order.delivery_address}</p>}
            <p className="purchase-muted">Status: {order.fulfillment_status || "aguardando pagamento"}</p>
          </section>
        </div>
      </Container>
    </div>
  );
}
