import React, { useContext, useEffect, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaCamera, FaCheckCircle, FaClock, FaHistory, FaQrcode } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import {
  getCommerceFulfillmentEvents,
  getEstablishmentCommerceOrders,
  updateCommerceFulfillmentStatus,
  updateCommerceOrderStatus,
} from "../../services/commerce";
import "./Commerce.css";
import "./FulfillmentLifecycle.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];
const terminalFulfillment = new Set(["fulfilled", "delivered", "blocked"]);
const readyFulfillment = new Set(["ready", "available"]);

const fulfillmentLabel = (order) => {
  const status = String(order?.fulfillment_status || "pending").toLowerCase();
  if (status === "preparing") return "Preparando";
  if (readyFulfillment.has(status)) return order?.fulfillment === "delivery" ? "Pronto para entrega" : "Pronto para retirada";
  if (status === "fulfilled") return "Retirado";
  if (status === "delivered") return "Entregue";
  if (status === "blocked") return "Bloqueado";
  return order?.payment_status === "paid" ? "Aguardando preparo" : "Aguardando pagamento";
};

export default function SellerOrdersPage() {
  const { establishments } = useContext(AuthContext);
  const navigate = useNavigate();
  const [establishmentId, setEstablishmentId] = useState(() => establishments?.[0]?.id || "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState("");
  const [historyByOrder, setHistoryByOrder] = useState({});
  const [error, setError] = useState("");

  const load = async ({ background = false } = {}) => {
    if (!establishmentId) return;
    if (!background) setLoading(true);
    setError("");
    try {
      const payload = await getEstablishmentCommerceOrders(establishmentId, { per_page: 100 });
      setOrders(Array.isArray(payload?.data) ? payload.data : []);
    } catch (requestError) {
      if (!background) setError(requestError?.response?.data?.message || "Não foi possível carregar os pedidos recebidos.");
    } finally {
      if (!background) setLoading(false);
    }
  };

  useEffect(() => {
    load();
    if (!establishmentId) return undefined;
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") load({ background: true });
    }, 10000);
    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [establishmentId]);

  const replaceOrder = (updated) => {
    if (!updated?.public_id) return;
    setOrders((current) => current.map((row) => row.public_id === updated.public_id ? updated : row));
  };

  const changeStatus = async (order, status) => {
    setUpdating(order.public_id); setError("");
    try {
      replaceOrder(await updateCommerceOrderStatus(order.public_id, status));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar o pedido.");
    } finally { setUpdating(""); }
  };

  const changeFulfillment = async (order, status) => {
    setUpdating(order.public_id); setError("");
    try {
      replaceOrder(await updateCommerceFulfillmentStatus(order.public_id, status));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar o preparo do pedido.");
    } finally { setUpdating(""); }
  };

  const toggleHistory = async (order) => {
    if (historyByOrder[order.public_id]) {
      setHistoryByOrder((current) => ({ ...current, [order.public_id]: null }));
      return;
    }
    try {
      const events = await getCommerceFulfillmentEvents(order.public_id, { limit: 20 });
      setHistoryByOrder((current) => ({ ...current, [order.public_id]: events }));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível carregar o histórico deste pedido.");
    }
  };

  return <div className="commerce-page"><GlobalNav /><Container className="commerce-shell">
    <div className="seller-orders-toolbar">
      <div className="commerce-heading"><span>Vendas</span><h1>Pedidos recebidos</h1><p>Pagamento, preparo, liberação e recebimento agora são etapas independentes e auditáveis.</p></div>
      <Button size="lg" className="seller-scan-button" onClick={() => navigate("/orders/scan")}><FaCamera /> Ler QR Code do cliente</Button>
    </div>
    <Alert variant="info" className="seller-qr-hint"><FaQrcode /> O comprovante do cliente só deve ser validado quando o pedido estiver marcado como pronto. Escanear apenas confere; a baixa exige confirmação explícita.</Alert>
    {establishments?.length > 0 && <Form.Select className="mb-3" value={establishmentId} onChange={(e) => setEstablishmentId(e.target.value)}>{establishments.map((est) => <option key={est.id} value={est.id}>{est.fantasy || est.name}</option>)}</Form.Select>}
    {error && <Alert variant="danger">{error}</Alert>}
    {!establishmentId ? <Alert variant="info">Cadastre uma empresa para começar a receber pedidos.</Alert> : loading ? <div className="text-center"><Spinner animation="border" /></div> : orders.length === 0 ? <Alert variant="info">Nenhuma compra recebida ainda.</Alert> : <div className="orders-list">{orders.map((order) => {
      const fulfillmentStatus = String(order.fulfillment_status || "pending").toLowerCase();
      const isReady = readyFulfillment.has(fulfillmentStatus);
      const isTerminal = terminalFulfillment.has(fulfillmentStatus);
      const isPaid = order.payment_status === "paid";
      const isUpdating = updating === order.public_id;
      const history = historyByOrder[order.public_id];

      return <article className="order-card" key={order.public_id}>
        <div className="order-card__top"><div><strong>#{order.order_number} · {order.customer_name}</strong><div>{(order.items || []).map((row) => `${row.quantity}× ${row.name}`).join(" · ")}</div></div><strong>{money(order.total_price)}</strong></div>
        <div className="order-card__meta">
          <span>Pagamento: {isPaid ? "pago" : order.payment_status}</span>
          <span>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</span>
          <span className={`fulfillment-status-badge ${fulfillmentStatus}`}>{isTerminal ? <FaCheckCircle /> : <FaClock />}{fulfillmentLabel(order)}</span>
        </div>
        {order.delivery_address && <p className="mt-2 mb-0"><strong>Endereço:</strong> {order.delivery_address}</p>}

        <div className="seller-fulfillment-actions">
          {isPaid && !isTerminal && !isReady && fulfillmentStatus !== "preparing" && (
            <Button size="sm" disabled={isUpdating} onClick={() => changeFulfillment(order, "preparing")}><FaClock /> Iniciar preparo</Button>
          )}
          {isPaid && fulfillmentStatus === "preparing" && (
            <Button size="sm" disabled={isUpdating} onClick={() => changeFulfillment(order, "ready")}><FaCheckCircle /> Marcar como pronto</Button>
          )}
          {isReady && !isTerminal && (
            <Button size="sm" variant="outline-info" onClick={() => navigate(`/redeem/${encodeURIComponent(order.public_id)}`)}><FaQrcode /> Validar retirada/entrega</Button>
          )}
          <Button size="sm" variant="outline-light" onClick={() => toggleHistory(order)}><FaHistory /> {history ? "Ocultar histórico" : "Histórico"}</Button>
        </div>

        <div className="commerce-actions">
          <Form.Select size="sm" value={order.status || "pending"} disabled={isUpdating} onChange={(e) => changeStatus(order, e.target.value)} style={{ maxWidth: 190 }}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</Form.Select>
        </div>

        {history && <div className="fulfillment-history"><h3>Histórico de recebimento</h3>{history.length === 0 ? <small>Nenhum evento registrado ainda.</small> : history.map((event) => <div className="fulfillment-history__item" key={event.id}><div><strong>{event.event}</strong><small>{event.from_status || "—"} → {event.to_status || "—"}{event.actor?.user_name || event.actor?.first_name ? ` · ${event.actor.user_name || event.actor.first_name}` : ""}</small></div><small>{event.created_at ? new Date(event.created_at).toLocaleString("pt-BR") : ""}</small></div>)}</div>}
      </article>;
    })}</div>}
  </Container></div>;
}
