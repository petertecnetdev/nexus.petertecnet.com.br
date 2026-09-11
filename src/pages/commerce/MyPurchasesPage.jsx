import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Container, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import { getMyCommerceOrders } from "../../services/commerce";
import { trackExperienceEvent } from "../../services/experienceTelemetry";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const RECOVERABLE_PAYMENT_STATUSES = new Set(["pending", "waiting", "processing", "failed", "rejected"]);
const RECOVERY_EXPERIMENT = "pix_recovery_navbar_prominence_v1";
const RECOVERY_REFRESH_MS = 30000;
const isRecoverable = (order) => RECOVERABLE_PAYMENT_STATUSES.has(String(order?.payment_status || "").toLowerCase());
const recoveryVariant = (orderId) => {
  const value = String(orderId || "");
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) hash = ((hash << 5) - hash + value.charCodeAt(index)) | 0;
  return Math.abs(hash) % 2 === 0 ? "control" : "prominent";
};

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const exposureRef = useRef("");
  const refreshInFlightRef = useRef(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const recoverableOrders = useMemo(() => orders.filter(isRecoverable), [orders]);
  const recoveryOrder = recoverableOrders[0] || null;
  const variant = recoveryOrder ? recoveryVariant(recoveryOrder.id) : null;

  const loadOrders = useCallback(async ({ background = false } = {}) => {
    if (refreshInFlightRef.current) return;
    refreshInFlightRef.current = true;
    try {
      const payload = await getMyCommerceOrders({ per_page: 50 });
      setOrders(Array.isArray(payload?.data) ? payload.data : []);
      setError("");
    } catch (requestError) {
      if (!background) setError(requestError?.response?.data?.message || "Não foi possível carregar suas compras.");
    } finally {
      refreshInFlightRef.current = false;
      if (!background) setLoading(false);
    }
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  useEffect(() => {
    if (loading || recoverableOrders.length === 0) return undefined;
    const refreshIfVisible = () => {
      if (document.visibilityState === "visible") loadOrders({ background: true });
    };
    const timer = window.setInterval(refreshIfVisible, RECOVERY_REFRESH_MS);
    document.addEventListener("visibilitychange", refreshIfVisible);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", refreshIfVisible);
    };
  }, [loading, recoverableOrders.length, loadOrders]);

  useEffect(() => {
    if (loading || !recoveryOrder || !variant) return;
    const exposureKey = `${recoveryOrder.id}:${variant}`;
    if (exposureRef.current === exposureKey) return;
    exposureRef.current = exposureKey;
    trackExperienceEvent(
      "frontend_checkout_recovery_notification_cta_viewed",
      "Recuperação de pagamento",
      `/purchase/${recoveryOrder.id}`,
      {
        order_id: recoveryOrder.id,
        recovery_prominence_experiment: RECOVERY_EXPERIMENT,
        recovery_prominence_variant: variant,
        payment_status: recoveryOrder.payment_status,
      }
    );
  }, [loading, recoveryOrder, variant]);

  const continuePayment = (order) => {
    if (recoveryOrder?.id === order.id && variant) {
      trackExperienceEvent(
        "frontend_checkout_recovery_notification_cta_clicked",
        "Continuar pagamento",
        `/purchase/${order.id}`,
        {
          order_id: order.id,
          recovery_prominence_experiment: RECOVERY_EXPERIMENT,
          recovery_prominence_variant: variant,
          payment_status: order.payment_status,
        }
      );
    }
    navigate(`/purchase/${order.id}`);
  };

  return <div className="commerce-page"><GlobalNav /><Container className="commerce-shell">
    <div className="commerce-heading"><span>Histórico</span><h1>Minhas compras</h1><p>Acompanhe pagamentos, retirada e entrega.</p></div>
    {error && <Alert variant="danger">{error}</Alert>}
    {!loading && recoveryOrder && variant === "prominent" && <Alert variant="warning" className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"><div><strong>Você tem {recoverableOrders.length === 1 ? "uma compra aguardando pagamento" : `${recoverableOrders.length} compras aguardando pagamento`}.</strong><div>Continue de onde parou sem criar um novo pedido.</div></div><Button variant="warning" onClick={() => continuePayment(recoveryOrder)}>Continuar pagamento</Button></Alert>}
    {loading ? <div className="text-center"><Spinner animation="border" /></div> : orders.length === 0 ? <Alert variant="info">Você ainda não realizou compras pela Nexus.</Alert> : <div className="orders-list">{orders.map((order) => { const recoverable = isRecoverable(order); return <article className={`order-card${recoverable ? " border border-warning" : ""}`} key={order.id}><div className="order-card__top"><div><strong>Compra #{order.order_number}</strong>{recoverable && <Badge bg="warning" text="dark" className="ms-2">Pagamento pendente</Badge>}<div>{order.establishment?.fantasy || order.establishment?.name}</div></div><strong>{money(order.total_price)}</strong></div><div className="order-card__meta"><span>Pagamento: {order.payment_status}</span><span>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}: {order.fulfillment_status || "pendente"}</span></div><div className="commerce-actions">{recoverable ? <Button size="sm" variant="warning" onClick={() => continuePayment(order)}>Continuar pagamento</Button> : <Button size="sm" onClick={() => navigate(`/purchase/${order.id}`)}>Ver compra e QR</Button>}{order.establishment?.slug && <Button size="sm" variant="outline-light" onClick={() => navigate(`/catalog/${order.establishment.slug}`)}>Ver catálogo</Button>}</div></article>; })}</div>}
  </Container></div>;
}
