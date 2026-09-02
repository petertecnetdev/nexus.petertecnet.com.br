import React, { useEffect, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { FaBoxOpen, FaCheckCircle, FaClock, FaQrcode } from "react-icons/fa";
import { Link } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import commerceService from "../../services/CommerceService";
import "./PurchasePage.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export default function MyPurchasesPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    commerceService.myOrders({ per_page: 50 })
      .then((data) => active && setOrders(Array.isArray(data?.data) ? data.data : []))
      .catch((err) => active && setError(err?.message || "Não foi possível carregar suas compras."))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  return (
    <div className="purchase-page">
      <GlobalNav />
      <Container className="purchase-shell py-4 py-lg-5">
        <div className="commerce-heading"><span>Histórico</span><h1>Minhas compras</h1><p>Acompanhe pagamentos e recupere o QR Code de retirada ou entrega sempre que precisar.</p></div>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? <div className="purchase-loading"><Spinner animation="border" /> Carregando compras…</div> : orders.length === 0 ? (
          <div className="commerce-empty"><FaBoxOpen /><h1>Nenhuma compra ainda</h1><p>Quando você comprar um item em um catálogo da Nexus, ele aparecerá aqui.</p><Button as={Link} to="/">Explorar catálogos</Button></div>
        ) : (
          <div className="purchase-list">
            {orders.map((order) => {
              const paid = order.payment_status === "paid";
              const fulfilled = ["fulfilled", "delivered"].includes(order.fulfillment_status);
              return <Link className="purchase-list__item" to={`/purchase/${encodeURIComponent(order.public_id)}`} key={order.public_id}>
                <div className={`purchase-list__icon ${paid ? "is-paid" : ""}`}>{fulfilled ? <FaCheckCircle /> : paid ? <FaQrcode /> : <FaClock />}</div>
                <div className="purchase-list__copy"><strong>{order.establishment?.fantasy || order.establishment?.name || `Compra #${order.order_number}`}</strong><span>Pedido #{order.order_number} · {order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</span></div>
                <div className="purchase-list__status"><strong>{money(order.total_price)}</strong><span>{fulfilled ? "Concluído" : paid ? "QR liberado" : "Aguardando pagamento"}</span></div>
              </Link>;
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
