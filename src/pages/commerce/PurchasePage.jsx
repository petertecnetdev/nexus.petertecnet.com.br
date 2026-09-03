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
import {
  getCommerceFulfillmentCredential,
  getCommerceOrder,
  getCommercePayment,
  retryCommercePayment,
} from "../../services/commerce";
import {
  getPurchaseQrPurpose,
  getPurchaseStage,
  isFulfillmentComplete,
  isFulfillmentReady,
} from "./purchaseQrState";
import "./Commerce.css";
import "./PurchaseQr.css";

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
  const [claim, setClaim] = useState(null);
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

  useEffect(() => {
    if (!order || !isFulfillmentReady(order.fulfillment_status)) {
      setClaim(null);
      return undefined;
    }

    let active = true;
    setClaim(order.claim || null);

    getCommerceFulfillmentCredential(publicId, { background: true, silent: true })
      .then((payload) => {
        if (active && payload?.claim) setClaim(payload.claim);
      })
      .catch(() => {
        // Compatibilidade durante rollout: pedidos antigos ainda trazem o token no próprio pedido.
      });

    return () => { active = false; };
  }, [order, publicId]);

  const paymentStatus = String(order?.payment_status || "").toLowerCase();
  const fulfillmentComplete = isFulfillmentComplete(order?.fulfillment_status);

  useEffect(() => {
    if (!order) return undefined;

    const terminalPayments = ["refunded", "failed", "cancelled", "canceled"];
    const shouldKeepPolling = paymentStatus === "paid"
      ? !fulfillmentComplete && order?.fulfillment_status !== "blocked"
      : !terminalPayments.includes(paymentStatus);

    if (!shouldKeepPolling) return undefined;

    let active = true;
    let timer = null;

    const poll = async () => {
      if (!active) return;
      if (document.visibilityState === "visible") await refresh({ background: true });
      if (active) timer = window.setTimeout(poll, 4000);
    };

    timer = window.setTimeout(poll, 4000);
    return () => {
      active = false;
      if (timer) window.clearTimeout(timer);
    };
  }, [order, paymentStatus, fulfillmentComplete, refresh]);

  const isPaid = paymentStatus === "paid";
  const isDelivery = order?.fulfillment === "delivery";
  const stage = getPurchaseStage({ paymentStatus, fulfillmentStatus: order?.fulfillment_status });

  useEffect(() => {
    if (!order || stage !== 2) return;
    const notificationKey = `nexus_ready_notified_${order.public_id}`;
    if (sessionStorage.getItem(notificationKey)) return;

    sessionStorage.setItem(notificationKey, "1");
    if (typeof Notification !== "undefined" && Notification.permission === "granted") {
      new Notification(isDelivery ? "Pedido pronto para entrega" : "Pedido pronto para retirada", {
        body: `${order.establishment?.fantasy || order.establishment?.name || "O estabelecimento"} liberou o pedido #${order.order_number}.`,
      });
    }
  }, [isDelivery, order, stage]);

  const claimUrl = useMemo(() => {
    if (!claim?.token || !order?.public_id) return "";
    return `${window.location.origin}/redeem/${encodeURIComponent(order.public_id)}#token=${encodeURIComponent(claim.token)}`;
  }, [claim, order]);

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

  const heading = !isPaid
    ? "Aguardando pagamento"
    : stage === 1
      ? "Pagamento aprovado"
      : stage === 2
        ? (isDelivery ? "Pedido pronto para entrega" : "Pedido pronto para retirada")
        : (isDelivery ? "Entrega concluída" : "Retirada concluída");

  const steps = [
    { label: "Pagamento", detail: isPaid ? "Confirmado" : "Pendente" },
    { label: "Preparando", detail: stage >= 2 ? "Concluído" : "Em andamento" },
    { label: "Pronto", detail: stage >= 3 ? "Concluído" : stage === 2 ? "Liberado" : "Aguardando" },
    { label: isDelivery ? "Recebido" : "Retirado", detail: stage === 3 ? "Concluído" : "Aguardando" },
  ];

  if (loading && !order) return <><GlobalNav /><Container className="commerce-shell text-center"><Spinner animation="border" /></Container></>;

  return (
    <div className="commerce-page">
      <GlobalNav />
      <Container className="commerce-shell">
        <div className="commerce-card purchase-card">
          <div className="commerce-heading">
            <span>Compra #{order?.order_number || ""}</span>
            <h1>{heading}</h1>
            <p>{order?.establishment?.fantasy || order?.establishment?.name}</p>
          </div>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className={`purchase-flow purchase-flow--four purchase-flow--stage-${stage}`} aria-label="Etapas da compra">
            {steps.map((step, index) => {
              const completed = index < stage || stage === 3;
              const active = index === stage && stage < 3;
              return (
                <React.Fragment key={step.label}>
                  <div className={`purchase-flow__step ${completed ? "completed" : active ? "active" : "locked"}`}>
                    <span className="purchase-flow__index">{completed ? <FaCheckCircle /> : index + 1}</span>
                    <div><small>{step.detail}</small><strong>{step.label}</strong></div>
                  </div>
                  {index < steps.length - 1 && <div className="purchase-flow__connector" aria-hidden="true" />}
                </React.Fragment>
              );
            })}
          </div>

          <div className={`purchase-status ${isPaid ? "purchase-status--paid payment-success-reveal" : ""}`}>
            {isPaid ? <FaCheckCircle size={28} /> : <FaClock size={28} />}
            <div>
              <strong>{!isPaid
                ? (order?.payment_status === "failed" ? "Pagamento não concluído" : "Pagamento pendente")
                : stage === 1
                  ? "Pagamento confirmado. O estabelecimento está preparando seu pedido."
                  : stage === 2
                    ? "Seu pedido está pronto. Use o comprovante de retirada/entrega abaixo."
                    : "Pedido concluído com sucesso."}</strong>
              <small>{!isPaid
                ? "A confirmação acontece automaticamente, sem recarregar a página."
                : stage === 1
                  ? "O QR de pagamento já foi encerrado. O comprovante de retirada só será liberado quando o pedido estiver pronto."
                  : stage === 2
                    ? "O QR abaixo não realiza pagamentos e é válido para uma única confirmação."
                    : "O comprovante de uso único foi encerrado após a confirmação."}</small>
            </div>
          </div>

          {isPaid && stage === 1 && (
            <div className="fulfillment-preparing-card">
              <FaBoxOpen size={30} />
              <div><strong>Pedido em preparação</strong><span>Você pode manter esta página aberta. A Nexus atualiza automaticamente quando o estabelecimento marcar o pedido como pronto.</span></div>
            </div>
          )}

          {stage === 2 && (
            <Alert variant="success" className="ready-now-alert">
              <FaCheckCircle /> <strong>{isDelivery ? "Pedido liberado para entrega." : "Pedido liberado para retirada."}</strong>
            </Alert>
          )}

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
              <div className="payment-qr-note"><FaClock /><span>Depois do pagamento este QR desaparece. O comprovante de retirada é uma etapa diferente.</span></div>
            </div>
          )}

          {qrPurpose === "fulfillment" && (
            <div className={`claim-box claim-ticket ${isDelivery ? "claim-ticket--delivery" : "claim-ticket--pickup"}`} data-qr-purpose="fulfillment">
              <div className="claim-ticket__confirmed"><FaCheckCircle /><span>PAGAMENTO CONFIRMADO · PEDIDO PRONTO</span></div>
              <div className="qr-purpose-badge qr-purpose-badge--fulfillment"><FaBoxOpen /> {isDelivery ? "COMPROVANTE DE ENTREGA" : "COMPROVANTE DE RETIRADA"}</div>
              <h2>{order?.establishment?.fantasy || order?.establishment?.name || (isDelivery ? "Pedido pronto para entrega" : "Retirada liberada")}</h2>
              <p className="claim-ticket__establishment">{isDelivery ? "Receba deste estabelecimento" : "Retire neste estabelecimento"}</p>
              {order?.establishment?.address && <p className="claim-ticket__address">{order.establishment.address}{order.establishment.city ? ` · ${order.establishment.city}${order.establishment.uf ? `/${order.establishment.uf}` : ""}` : ""}</p>}
              <p className="qr-purpose-description">{isDelivery ? "Mostre este comprovante ao vendedor somente quando receber seus itens." : "Mostre este comprovante ao atendente somente no momento da retirada."}</p>

              <div className="claim-ticket__qr">
                <LocalQrCode value={claimUrl} title={`${isDelivery ? "Entrega" : "Retirada"} da compra ${order.order_number}`} />
              </div>

              {claim?.code && (
                <div className="claim-manual-code">
                  <small>Se a câmera falhar, informe este código</small>
                  <strong>{claim.code}</strong>
                  <Button size="sm" variant="outline-light" onClick={() => copy(claim.code)}><FaCopy /> Copiar código</Button>
                </div>
              )}

              <div className="claim-ticket__details">
                <div><small>Pedido</small><strong>#{order.order_number}</strong></div>
                <div><small>Finalidade</small><strong>{isDelivery ? "Confirmar entrega" : "Confirmar retirada"}</strong></div>
                <div><small>Validade</small><strong>Uso único</strong></div>
              </div>

              <div className="claim-ticket__items">
                <small>Itens deste comprovante</small>
                {(order?.items || []).map((row) => <div key={`claim-${row.item_id}`}><span>{row.quantity}× {row.name}</span><strong>{money(row.subtotal)}</strong></div>)}
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
              <div><strong>{order?.fulfillment_status === "delivered" ? "Entrega já confirmada" : "Retirada já confirmada"}</strong><span>O comprovante de uso único foi encerrado e não pode ser reutilizado.</span></div>
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
