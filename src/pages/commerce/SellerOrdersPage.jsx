import React, { useContext, useEffect, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import { getEstablishmentCommerceOrders, updateCommerceOrderStatus } from "../../services/commerce";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const statuses = ["pending", "confirmed", "preparing", "ready", "completed", "cancelled"];

export default function SellerOrdersPage() {
  const { establishments } = useContext(AuthContext);
  const navigate = useNavigate();
  const [establishmentId, setEstablishmentId] = useState(() => establishments?.[0]?.id || "");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    if (!establishmentId) return;
    setLoading(true); setError("");
    try {
      const payload = await getEstablishmentCommerceOrders(establishmentId, { per_page: 100 });
      setOrders(Array.isArray(payload?.data) ? payload.data : []);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível carregar os pedidos recebidos.");
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [establishmentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (order, status) => {
    try {
      const updated = await updateCommerceOrderStatus(order.public_id, status);
      setOrders((current) => current.map((row) => row.public_id === order.public_id ? updated : row));
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível atualizar o pedido.");
    }
  };

  return <div className="commerce-page"><GlobalNav /><Container className="commerce-shell">
    <div className="commerce-heading"><span>Vendas</span><h1>Pedidos recebidos</h1><p>Prepare, entregue e valide as compras feitas pelos seus clientes.</p></div>
    {establishments?.length > 0 && <Form.Select className="mb-3" value={establishmentId} onChange={(e) => setEstablishmentId(e.target.value)}>{establishments.map((est) => <option key={est.id} value={est.id}>{est.fantasy || est.name}</option>)}</Form.Select>}
    {error && <Alert variant="danger">{error}</Alert>}
    {!establishmentId ? <Alert variant="info">Cadastre uma empresa para começar a receber pedidos.</Alert> : loading ? <div className="text-center"><Spinner animation="border" /></div> : orders.length === 0 ? <Alert variant="info">Nenhuma compra recebida ainda.</Alert> : <div className="orders-list">{orders.map((order) => <article className="order-card" key={order.public_id}><div className="order-card__top"><div><strong>#{order.order_number} · {order.customer_name}</strong><div>{(order.items || []).map((row) => `${row.quantity}× ${row.name}`).join(" · ")}</div></div><strong>{money(order.total_price)}</strong></div><div className="order-card__meta"><span>Pagamento: {order.payment_status}</span><span>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</span><span>QR: {order.fulfillment_status || "aguardando"}</span></div>{order.delivery_address && <p className="mt-2 mb-0"><strong>Endereço:</strong> {order.delivery_address}</p>}<div className="commerce-actions"><Form.Select size="sm" value={order.status || "pending"} onChange={(e) => changeStatus(order, e.target.value)} style={{ maxWidth: 190 }}>{statuses.map((status) => <option key={status} value={status}>{status}</option>)}</Form.Select>{order.payment_status === "paid" && !["fulfilled", "delivered"].includes(order.fulfillment_status) && <Button size="sm" variant="outline-info" onClick={() => navigate(`/redeem/${order.public_id}`)}>Validar QR</Button>}</div></article>)}</div>}
  </Container></div>;
}
