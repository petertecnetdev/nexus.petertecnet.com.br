import React, { useCallback, useEffect, useState } from "react";
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import { FaCheckCircle, FaQrcode, FaShieldAlt } from "react-icons/fa";
import { Link, useParams, useSearchParams } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import commerceService from "../../services/CommerceService";
import "./PurchasePage.css";

const money = (value) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value || 0));

export default function RedeemPurchasePage() {
  const { publicId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const verify = useCallback(async () => {
    if (!publicId || !token) {
      setError("QR Code incompleto ou inválido.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      setOrder(await commerceService.verifyFulfillment(publicId, token));
    } catch (err) {
      setError(err?.message || "Não foi possível verificar esta compra.");
    } finally {
      setLoading(false);
    }
  }, [publicId, token]);

  useEffect(() => { verify(); }, [verify]);

  const redeem = async () => {
    setRedeeming(true);
    setError("");
    try {
      const result = await commerceService.redeem(publicId, token);
      setOrder(result);
      setMessage(order?.fulfillment === "delivery" ? "Entrega confirmada com sucesso." : "Retirada confirmada com sucesso.");
    } catch (err) {
      setError(err?.message || "Não foi possível concluir a entrega.");
    } finally {
      setRedeeming(false);
    }
  };

  const fulfilled = ["fulfilled", "delivered"].includes(order?.fulfillment_status);

  return (
    <div className="purchase-page">
      <GlobalNav />
      <Container className="purchase-shell py-4 py-lg-5">
        <div className="commerce-heading"><span>Validação segura</span><h1>QR Code da compra</h1><p>Esta página confirma o direito de retirada ou entrega. Somente responsáveis pelo estabelecimento podem concluir a validação.</p></div>
        {error && <Alert variant="danger">{error}</Alert>}
        {message && <Alert variant="success">{message}</Alert>}

        {loading ? <div className="purchase-loading"><Spinner animation="border" /> Verificando QR Code…</div> : order ? (
          <section className="redeem-card">
            <div className={`redeem-card__status ${fulfilled ? "is-complete" : ""}`}><FaShieldAlt /><div><span>{fulfilled ? "QR Code já utilizado" : "QR Code válido"}</span><h2>Compra #{order.order_number}</h2></div></div>
            <div className="redeem-card__facts">
              <div><span>Cliente</span><strong>{order.customer_name || "Cliente identificado"}</strong></div>
              <div><span>Recebimento</span><strong>{order.fulfillment === "delivery" ? "Entrega" : "Retirada"}</strong></div>
              <div><span>Pagamento</span><strong>{order.payment_status === "paid" ? "Pago" : order.payment_status}</strong></div>
              <div><span>Total</span><strong>{money(order.total_price)}</strong></div>
            </div>
            {order.delivery_address && <div className="redeem-card__address"><span>Endereço de entrega</span><strong>{order.delivery_address}</strong></div>}
            <div className="redeem-card__items">{(order.items || []).map((item) => <div key={item.item_id}><span>{item.quantity}× {item.name}</span><strong>{money(item.subtotal)}</strong></div>)}</div>

            {fulfilled ? (
              <div className="redeem-card__done"><FaCheckCircle /><div><strong>Entrega concluída</strong><span>Este QR Code não pode ser usado novamente.</span></div></div>
            ) : (
              <Button className="purchase-primary w-100" onClick={redeem} disabled={redeeming}>
                <FaQrcode /> {redeeming ? "Confirmando…" : order.fulfillment === "delivery" ? "Confirmar entrega" : "Confirmar retirada"}
              </Button>
            )}
          </section>
        ) : (
          <div className="commerce-empty"><FaQrcode /><h1>Não foi possível validar</h1><p>Confira se o QR Code pertence a uma compra paga deste estabelecimento.</p><Button as={Link} to="/">Voltar à Nexus</Button></div>
        )}
      </Container>
    </div>
  );
}
