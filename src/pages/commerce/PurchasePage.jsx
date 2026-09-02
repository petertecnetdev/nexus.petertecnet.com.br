import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaClock, FaCopy, FaCreditCard, FaQrcode } from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import LocalQrCode from "../../components/LocalQrCode";
import { getCommerceOrder, getCommercePayment, retryCommercePayment } from "../../services/commerce";
import "./Commerce.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

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

  const refresh = useCallback(async () => {
    try {
      const result = await getCommercePayment(publicId);
      if (result?.order) setOrder(result.order);
      if (result?.payment) setPayment((current) => ({ ...current, ...result.payment }));
      setError("");
    } catch (requestError) {
      try {
        const fallback = await getCommerceOrder(publicId);
        setOrder(fallback);
      } catch {
        setError(requestError?.response?.data?.message || "Não foi possível consultar sua compra.");
      }
    } finally {
      setLoading(false);
    }
  }, [publicId]);

  useEffect(() => { refresh(); }, [refresh]);
  useEffect(() => {
    if (order?.payment_status === "paid" || order?.payment_status === "refunded") return undefined;
    const timer = window.setInterval(refresh, 4000);
    return () => window.clearInterval(timer);
  }, [order?.payment_status, refresh]);

  const claimUrl = useMemo(() => {
    if (!order?.claim?.token || !order?.public_id) return "";
    return `${window.location.origin}/redeem/${encodeURIComponent(order.public_id)}?token=${encodeURIComponent(order.claim.token)}`;
  }, [order]);

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
          <div className="commerce-heading"><span>Compra #{order?.order_number || ""}</span><h1>{order?.payment_status === "paid" ? "Pagamento confirmado" : "Aguardando pagamento"}</h1><p>{order?.establishment?.fantasy || order?.establishment?.name}</p></div>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="purchase-status">
            {order?.payment_status === "paid" ? <FaCheckCircle size={28} /> : <FaClock size={28} />}
            <div><strong>{order?.payment_status === "paid" ? "Compra paga" : order?.payment_status === "failed" ? "Pagamento não concluído" : "Pagamento pendente"}</strong><small>{order?.payment_status === "paid" ? "Seu direito de retirada/entrega já está liberado." : "A Nexus atualiza esta tela automaticamente após a confirmação."}</small></div>
          </div>

          <div className="purchase-items">
            {(order?.items || []).map((row) => <div className="purchase-item" key={row.item_id}><span>{row.quantity}× {row.name}</span><strong>{money(row.subtotal)}</strong></div>)}
          </div>
          <div className="order-summary"><span>Total <strong>{money(order?.total_price)}</strong></span><span>Recebimento <strong>{order?.fulfillment === "delivery" ? "Entrega" : "Retirada"}</strong></span></div>

          {order?.payment_status !== "paid" && payment?.method === "pix" && (payment?.qr_code || payment?.qr_code_base64) && (
            <div className="pix-box">
              <FaQrcode size={28} />
              <h2>Pague com Pix</h2>
              {payment.qr_code_base64 && <img src={`data:image/png;base64,${payment.qr_code_base64}`} alt="QR Code Pix" />}
              {payment.qr_code && <><div className="pix-code">{payment.qr_code}</div><Button className="mt-3" onClick={() => copy(payment.qr_code)}><FaCopy /> Copiar Pix</Button></>}
            </div>
          )}

          {order?.payment_status === "paid" && claimUrl && (
            <div className="claim-box">
              <FaCheckCircle size={32} />
              <h2>{order.fulfillment === "delivery" ? "QR Code da entrega" : "QR Code para retirada"}</h2>
              <p>{order.fulfillment === "delivery" ? "Apresente este QR ao vendedor no momento da entrega." : "Apresente este QR no estabelecimento para retirar seus itens."}</p>
              <LocalQrCode value={claimUrl} title={`Compra ${order.order_number}`} />
              <small>Uso único. Após a validação, este QR deixa de conceder a retirada/entrega.</small>
            </div>
          )}

          {order?.fulfillment_status === "fulfilled" && <Alert variant="success" className="mt-3">Retirada já confirmada.</Alert>}
          {order?.fulfillment_status === "delivered" && <Alert variant="success" className="mt-3">Entrega já confirmada.</Alert>}

          <div className="commerce-actions">
            {order?.payment_status !== "paid" && payment?.method === "card" && payment?.checkout_url && <Button onClick={() => window.location.assign(payment.checkout_url)}><FaCreditCard /> Continuar pagamento</Button>}
            {order?.payment_status === "failed" && <><Button disabled={retrying} onClick={() => retry("pix")}><FaQrcode /> Tentar Pix</Button><Button variant="outline-light" disabled={retrying} onClick={() => retry("card")}><FaCreditCard /> Tentar cartão</Button></>}
            <Button variant="outline-light" onClick={() => navigate("/purchases")}>Minhas compras</Button>
            {order?.establishment?.slug && <Button variant="outline-info" onClick={() => navigate(`/catalog/${order.establishment.slug}`)}>Voltar ao catálogo</Button>}
          </div>
        </div>
      </Container>
    </div>
  );
}
