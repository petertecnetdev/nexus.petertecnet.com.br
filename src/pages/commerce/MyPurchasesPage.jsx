import React, { useEffect, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import { getMyCommerceOrders } from "../../services/commerce";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function MyPurchasesPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    {loading ? <div className="text-center"><Spinner animation="border" /></div> : orders.length === 0 ? <Alert variant="info">Você ainda não realizou compras pela Nexus.</Alert> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.public_id}><div className="order-card__top"><div><strong>Compra #{order.order_number}</strong><div>{order.establishment?.fantasy || order.establishment?.name}</div></div><strong>{money(order.total_price)}</strong></div><div className="order-card__meta"><span>Pagamento: {order.payment_status}</span><span>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}: {order.fulfillment_status || "pendente"}</span></div><div className="commerce-actions"><Button size="sm" onClick={() => navigate(`/purchase/${order.public_id}`)}>Ver compra e QR</Button>{order.establishment?.slug && <Button size="sm" variant="outline-light" onClick={() => navigate(`/catalog/${order.establishment.slug}`)}>Ver catálogo</Button>}</div></article>)}</div>}
  </Container></div>;
}
