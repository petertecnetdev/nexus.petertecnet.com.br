import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaCopy,
  FaCreditCard,
  FaQrcode,
  FaShieldAlt,
} from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import LocalQrCode from "../../components/LocalQrCode";
import { getCommerceOrder, getCommercePayment, retryCommercePayment } from "../../services/commerce";
import { getPurchaseQrPurpose, isFulfillmentComplete } from "./purchaseQrState";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const sameOrderSnapshot = (current, next) =>
  Boolean(current && next) &&
  current.public_id === next.public_id &&
  current.payment_status === next.payment_status &&
  current.fulfillment_status === next.fulfillment_status &&
  current.claim?.token === next.claim?.token;

const samePaymentSnapshot = (current, next) =>
  Boolean(current && next) &&
  current.method === next.method &&
  current.status === next.status &&
  current.payment_status === next.payment_status &&
  current.qr_code === next.qr_code &&
  current.qr_code_base64 === next.qr_code_base64 &&
  current.checkout_url === next.checkout_url;

export default function PurchasePage() {
  const { publicId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [payment, setPayment] = useState(() => {
    try { return JSON.parse(sessionStorage.getItem(`nexus_payment_${publicId}`) || "null"); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState("");
  const refreshInFlightRef = useRef(false);

  const refresh = useCallback(async ({ background = false } = {}) => {
    if (background && refreshInFlightRef.current) return;

    refreshInFlightRef.current = true;
    const options = { background, silent: true };

    try {
      const result = await getCommercePayment(publicId, options);
      if (result?.order) {
        setOrder((current) => (sameOrderSnapshot(current, result.order) ? current : result.order));
      }
      if (result?.payment) {
        setPayment((current) => {
          const next = { ...current, ...result.payment };
          return samePaymentSnapshot(current, next) ? current : next;
        });
      }
      setError("");
    } catch (requestError) {
      try {
        const fallback = await getCommerceOrder(publicId, options);
        if (fallback) {
          setOrder((current) => (sameOrderSnapshot(current, fallback) ? current : fallback));
        }
      } catch {
        if (!background) {
          setError(requestError?.response?.data?.message || "Não foi possível consultar sua compra.");
        }
      }
    } finally {
      refreshInFlightRef.current = false;
      if (!background) setLoading(false);
    }
  }, [publicId]);

  useEffect(() => { refresh(); }, [refresh]);

  const paymentStatus = order?.payment_status;

  useEffect(() => {
    if (!order) return undefined;

    const terminalStatuses = ["paid", "refunded", "failed", "cancelled", "canceled"];
    if (terminalStatuses.includes(paymentStatus)) return undefined;

    let active = true;
    let timer = null;

    const poll = async () => {
      if (!active) return;

      if (document.visibilityState === "visible") {
        await refresh({ background: true });
      }

      if (active) timer = window.setTimeout(poll, 4000);
    };

    timer = window.setTimeout(poll, 4000);

    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [order, paymentStatus, refresh]);

  const claimUrl = useMemo(() => {
    if (!order?.claim?.token || !order?.public_id) return "";
    return `${window.location.origin}/redeem/${encodeURIComponent(order.public_id)}#token=${encodeURIComponent(order.claim.token)}`;
  }, [order]);

  const isPaid = order?.payment_status === "paid";
  const isDelivery = order?.fulfillment === "delivery";
  const fulfillmentComplete = isFulfillmentComplete(order?.fulfillment_status);
  const qrPurpose = getPurchaseQrPurpose({
    paymentStatus: order?.payment_status,
    paymentMethod: payment?.method,
    hasPaymentQr: Boolean(payment?.qr_code || payment?.qr_code_base64),
    hasClaimQr: Boolean(claimUrl),
    fulfillmentStatus: order?.fulfillment_status,
  });

  const copy = async (text) => {
    if (!text) return;
    try { await navigator.clipboard.writeText(text); } catch { window.prompt("Copie o código:", text); }
  };

  const retry = async (method) => {
    setRetrying(true); setError("");
    try {
      const result = await retryCommercePayment(publicId, method);
      if (result?.order) setOrder(result.order);
      if (result?.payment) {
        setPayment(result.payment);
        sessionStorage.setItem(`nexus_payment_${publicId}`, JSON.stringify(result.payment));
        if (method === "card" && result.payment.checkout_url) window.location.assign(result.payment.checkout_url);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível iniciar uma nova tentativa de pagamento.");
    } finally { setRetrying(false); }
  };

  if (loading && !order) return <><GlobalNav /><Container className="commerce-shell text-center"><Spinner animation="border" /></Container></>;

  return (
    <div className="commerce-page">
      <GlobalNav />
      <Container className="commerce-shell">
        <div className="commerce-card purchase-card">
          <div className="commerce-heading">
            <span>Compra #{order?.order_number || ""}</span>
            <h1>{isPaid ? (isDelivery ? "Entrega liberada" : "Retirada liberada") : "Aguardando pagamento"}</h1>
            <p>{order?.establishment?.fantasy || order?.establishment?.name}</p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className={`purchase-flow ${isPaid ? "purchase-flow--paid" : "purchase-flow--pending"}`} aria-label="Etapas da compra">
            <div className={`purchase-flow__step ${isPaid ? "completed" : "active"}`}>
              <span className="purchase-flow__index">{isPaid ? <FaCheckCircle /> : "1"}</span>
              <div><small>Etapa 1</small><strong>{isPaid ? "Pagamento confirmado" : "Pagamento"}</strong></div>
            </div>
            <div className="purchase-flow__connector" aria-hidden="true" />
            <div className={`purchase-flow__step ${isPaid ? "active" : "locked"}`}>
              <span className="purchase-flow__index">2</span>
              <div><small>Etapa 2</small><strong>{isDelivery ? "Receber pedido" : "Retirar pedido"}</strong></div>
            </div>
          </div>

          <div className={`purchase-status ${isPaid ? "purchase-status--paid" : ""}`}>
            {isPaid ? <FaCheckCircle size={28} /> : <FaClock size={28} />}
            <div>
              <strong>{isPaid ? "Pagamento concluído. Agora use o comprovante abaixo." : order?.payment_status === "failed" ? "Pagamento não concluído" : "Pagamento pendente"}</strong>
              <small>{isPaid ? (isDelivery ? "O QR de pagamento não é mais necessário. Apresente o comprovante somente ao receber o pedido." : "O QR de pagamento não é mais necessário. Apresente o comprovante somente no momento da retirada.") : "A confirmação acontece automaticamente, sem recarregar a página."}</small>
            </div>
          </div>

          <div className="purchase-items">
            {(order?.items || []).map((row) => <div className="purchase-item" key={row.item_id}><span>{row.quantity}× {row.name}</span><strong>{money(row.subtotal)}</strong></div>)}
          </div>
          <div className="order-summary"><span>Total <strong>{money(order?.total_price)}</strong></span><span>Recebimento <strong>{isDelivery ? "Entrega" : "Retirada"}</strong></span></div>

          {qrPurpose === "payment" && (
            <div className="pix-box payment-qr-card" data-qr-purpose="payment">
              <div className="qr-purpose-badge qr-purpose-badge--payment"><FaQrcode /> QR CODE DE PAGAMENTO</div>
              <h2>Escaneie para pagar com Pix</h2>
              <p className="qr-purpose-description">Abra o aplicativo do seu banco e use este QR somente para concluir o pagamento desta compra.</p>
              {payment.qr_code_base64 && <div className="payment-qr-frame"><img src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code Pix para pagamento" /></div>}
              {payment.qr_code && <><div className="pix-code">{payment.qr_code}</div><Button className="mt-3" onClick={() => copy(payment.qr_code)}><FaCopy /> Copiar código Pix</Button></>}
              <div className="payment-qr-note"><FaClock /><span>Após a confirmação, este QR de pagamento desaparece e a etapa de retirada/entrega é liberada.</span></div>
            </div>
          )}

          {qrPurpose === "fulfillment" && (
            <div className={`claim-box claim-ticket ${isDelivery ? "claim-ticket--delivery" : "claim-ticket--pickup"}`} data-qr-purpose="fulfillment">
              <div className="claim-ticket__confirmed"><FaCheckCircle /><span>PAGAMENTO CONFIRMADO</span></div>
              <div className="qr-purpose-badge qr-purpose-badge--fulfillment"><FaBoxOpen /> {isDelivery ? "COMPROVANTE DE ENTREGA" : "COMPROVANTE DE RETIRADA"}</div>
              <h2>{isDelivery ? "Pedido pronto para entrega" : "Retirada liberada"}</h2>
              <p className="qr-purpose-description">{isDelivery ? "Mostre este QR ao vendedor somente no momento em que receber seus itens." : "Mostre este QR ao atendente somente quando estiver no estabelecimento para retirar seus itens."}</p>

              <div className="claim-ticket__qr">
                <LocalQrCode value={claimUrl} title={`${isDelivery ? "Entrega" : "Retirada"} da compra ${order.order_number}`} />
              </div>

              <div className="claim-ticket__details">
                <div><small>Pedido</small><strong>#{order.order_number}</strong></div>
                <div><small>Finalidade</small><strong>{isDelivery ? "Confirmar entrega" : "Confirmar retirada"}</strong></div>
                <div><small>Validade</small><strong>Uso único</strong></div>
              </div>

              <div className="claim-ticket__warning">
                <FaShieldAlt />
                <div><strong>NÃO É UM QR CODE DE PAGAMENTO</strong><span>Não escaneie no aplicativo do banco. Este código serve apenas para validar {isDelivery ? "a entrega" : "a retirada"} do pedido.</span></div>
              </div>
            </div>
          )}

          {fulfillmentComplete && (
            <div className="fulfillment-complete-card">
              <FaCheckCircle size={30} />
              <div><strong>{order?.fulfillment_status === "delivered" ? "Entrega já confirmada" : "Retirada já confirmada"}</strong><span>O comprovante de uso único foi encerrado e não precisa mais ser apresentado.</span></div>
            </div>
          )}

          <div className="commerce-actions">
            {!isPaid && payment?.method === "card" && payment?.checkout_url && <Button onClick={() => window.location.assign(payment.checkout_url)}><FaCreditCard /> Continuar pagamento</Button>}
            {order?.payment_status === "failed" && <><Button disabled={retrying} onClick={() => retry("pix")}><FaQrcode /> Tentar Pix</Button><Button variant="outline-light" disabled={retrying} onClick={() => retry("card")}><FaCreditCard /> Tentar cartão</Button></>}
            <Button variant="outline-light" onClick={() => navigate("/purchases")}>Minhas compras</Button>
            {order?.establishment?.slug && <Button variant="outline-info" onClick={() => navigate(`/catalog/${order.establishment.slug}`)}>Voltar ao catálogo</Button>}
          </div>
        </div>
      </Container>
    </div>
  );
}
