import React, { useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Container, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import { getMyCommerceOrders } from "../../services/commerce";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const RECOVERABLE_PAYMENT_STATUSES = new Set(["pending", "waiting", "processing", "failed", "rejected"]);
const isRecoverable = (order) => RECOVERABLE_PAYMENT_STATUSES.has(String(order?.payment_status || "").toLowerCase());

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const recoverableOrders = useMemo(() => orders.filter(isRecoverable), [orders]);

  useEffect(() => {
    let active = true;
    getMyCommerceOrders({ per_page: 50 })
      .then((payload) => { if (active) setOrders(Array.isArray(payload?.data) ? payload.data : []); })
      .catch((requestError) => { if (active) setError(requestError?.response?.data?.message || "Não foi possível carregar suas compras."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return <div className="commerce-page"><GlobalNav /><Container className="commerce-shell">
    <div className="commerce-heading"><span>Histórico</span><h1>Minhas compras</h1><p>Acompanhe pagamentos, retirada e entrega.</p></div>
    {error && <Alert variant="danger">{error}</Alert>}
    {!loading && recoverableOrders.length > 0 && <Alert variant="warning" className="d-flex flex-column flex-md-row align-items-md-center justify-content-between gap-3"><div><strong>Você tem {recoverableOrders.length === 1 ? "uma compra aguardando pagamento" : `${recoverableOrders.length} compras aguardando pagamento`}.</strong><div>Continue de onde parou sem criar um novo pedido.</div></div><Button variant="warning" onClick={() => navigate(`/purchase/${recoverableOrders[0].public_id}`)}>Continuar pagamento</Button></Alert>}
    {loading ? <div className="text-center"><Spinner animation="border" /></div> : orders.length === 0 ? <Alert variant="info">Você ainda não realizou compras pela Nexus.</Alert> : <div className="orders-list">{orders.map((order) => { const recoverable = isRecoverable(order); return <article className={`order-card${recoverable ? " border border-warning" : ""}`} key={order.public_id}><div className="order-card__top"><div><strong>Compra #{order.order_number}</strong>{recoverable && <Badge bg="warning" text="dark" className="ms-2">Pagamento pendente</Badge>}<div>{order.establishment?.fantasy || order.establishment?.name}</div></div><strong>{money(order.total_price)}</strong></div><div className="order-card__meta"><span>Pagamento: {order.payment_status}</span><span>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}: {order.fulfillment_status || "pendente"}</span></div><div className="commerce-actions">{recoverable ? <Button size="sm" variant="warning" onClick={() => navigate(`/purchase/${order.public_id}`)}>Continuar pagamento</Button> : <Button size="sm" onClick={() => navigate(`/purchase/${order.public_id}`)}>Ver compra e QR</Button>}{order.establishment?.slug && <Button size="sm" variant="outline-light" onClick={() => navigate(`/catalog/${order.establishment.slug}`)}>Ver catálogo</Button>}</div></article>; })}</div>}
  </Container></div>;
}
