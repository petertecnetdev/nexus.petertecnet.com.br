import React, { useContext, useEffect, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaHistory, FaQrcode } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import {
  getCommerceFulfillmentEvents,
  redeemCommerceOrder,
  verifyCommerceFulfillment,
} from "../../services/commerce";
import { parseCommerceClaimQr } from "./qrPayload";
import "./Commerce.css";
import "./FulfillmentLifecycle.css";

const money = (value) => Number(value || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function RedeemOrderPage() {
  const { publicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const locationClaim = parseCommerceClaimQr(`${location.pathname}${location.search}${location.hash}`);
  const locationToken = locationClaim?.publicId === publicId ? locationClaim.token : "";
  const [mode, setMode] = useState(locationToken ? "token" : "code");
  const [token, setToken] = useState(locationToken);
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState([]);
  const [error, setError] = useState("");

  const credential = (candidate = null) => {
    if (candidate) return { token: String(candidate).trim() };
    return mode === "code" ? { code: String(code).trim() } : { token: String(token).trim() };
  };

  const loadHistory = async () => {
    try {
      const events = await getCommerceFulfillmentEvents(publicId, { limit: 20 });
      setHistory(Array.isArray(events) ? events : []);
    } catch {
      // Histórico foi adicionado depois da validação por QR e não deve bloquear rollouts mistos.
    }
  };

  const verify = async (candidateToken = null) => {
    const payload = credential(candidateToken);
    const value = payload.token || payload.code || "";
    if (!user || !value || checking || processing) return;

    setChecking(true);
    setError("");
    setPreview(null);
    try {
      const order = await verifyCommerceFulfillment(publicId, payload);
      if (payload.token) {
        setMode("token");
        setToken(payload.token);
      } else {
        setMode("code");
        setCode(payload.code);
      }
      setPreview(order);
      await loadHistory();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível conferir este comprovante.");
    } finally {
      setChecking(false);
    }
  };

  const redeem = async () => {
    const payload = credential();
    if (!(payload.token || payload.code) || processing || !preview) return;
    setProcessing(true);
    setError("");
    try {
      const response = await redeemCommerceOrder(publicId, payload);
      const order = response?.data || null;
      setResult(order);
      setPreview(order);
      await loadHistory();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível registrar a retirada/entrega.");
    } finally {
      setProcessing(false);
    }
  };

  useEffect(() => {
    if (user && locationToken && !preview && !result && !checking && !processing) verify(locationToken);
    // A abertura do QR apenas confere a compra. A baixa exige confirmação explícita.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, locationToken]);

  const fulfilled = result || (preview && ["fulfilled", "delivered"].includes(preview.fulfillment_status));
  const actionLabel = preview?.fulfillment === "delivery" ? "Confirmar entrega" : "Confirmar retirada";
  const value = mode === "code" ? code : token;

  return (
    <div className="commerce-page">
      <GlobalNav />
      <Container className="commerce-shell">
        <div className="commerce-card redeem-result">
          <FaQrcode size={42} />
          <div className="commerce-heading">
            <span>Validação segura</span>
            <h1>Conferir compra</h1>
            <p>QR e código curto servem apenas para localizar e validar o pedido. A baixa só acontece depois da sua confirmação.</p>
          </div>

          {!user && <Alert variant="info">Entre na conta vinculada ao estabelecimento para conferir e validar esta compra.</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}

          {!user ? (
            <Button onClick={() => navigate("/login", { state: { from: { pathname: `${location.pathname}${location.search}${location.hash}` } } })}>Entrar para conferir</Button>
          ) : !preview && !result ? (
            <div className="redeem-token-form">
              <div className="redeem-credential-switch">
                <button type="button" className={mode === "code" ? "active" : ""} onClick={() => setMode("code")}>Código curto</button>
                <button type="button" className={mode === "token" ? "active" : ""} onClick={() => setMode("token")}>QR / token</button>
              </div>
              <Form onSubmit={(event) => { event.preventDefault(); verify(); }}>
                <Form.Group className="mb-3 text-start">
                  <Form.Label>{mode === "code" ? "Código de retirada/entrega" : "Token do QR Code"}</Form.Label>
                  <Form.Control
                    value={value}
                    onChange={(event) => mode === "code" ? setCode(event.target.value) : setToken(event.target.value)}
                    placeholder={mode === "code" ? "Ex.: RT-482-731" : "Preenchido automaticamente ao ler o QR"}
                    autoComplete="off"
                    inputMode={mode === "code" ? "text" : undefined}
                  />
                  <div className="redeem-token-preview mt-2">Pedido: {publicId}</div>
                </Form.Group>
                <div className="commerce-actions justify-content-center">
                  <Button type="submit" disabled={!value.trim() || checking}>
                    {checking ? <><Spinner size="sm" /> Conferindo…</> : "Conferir compra"}
                  </Button>
                  <Button variant="outline-light" onClick={() => navigate("/orders/scan")}>Ler QR com câmera</Button>
                </div>
              </Form>
            </div>
          ) : (
            <div className="redeem-preview">
              {fulfilled && (
                <Alert variant="success" className="redeem-success">
                  <FaCheckCircle size={26} />
                  <div><strong>{preview?.fulfillment === "delivery" ? "Entrega confirmada" : "Retirada confirmada"}</strong><span>Esta compra já foi registrada como concluída e o comprovante não pode ser reutilizado.</span></div>
                </Alert>
              )}

              <div className="redeem-preview__header">
                <div><small>Compra</small><strong>#{preview?.order_number || publicId}</strong></div>
                <div><small>Total</small><strong>{money(preview?.total_price)}</strong></div>
              </div>

              <div className="redeem-preview__meta">
                <div><small>Cliente</small><strong>{preview?.customer_name || "Cliente"}</strong></div>
                {preview?.customer_phone && <div><small>Telefone</small><strong>{preview.customer_phone}</strong></div>}
                <div><small>Pagamento</small><strong>{preview?.payment_status === "paid" ? "Pago" : preview?.payment_status}</strong></div>
                <div><small>Recebimento</small><strong>{preview?.fulfillment === "delivery" ? "Entrega" : "Retirada"}</strong></div>
                <div><small>Status</small><strong>{preview?.fulfillment_status || "—"}</strong></div>
                <div><small>Estabelecimento</small><strong>{preview?.establishment?.fantasy || preview?.establishment?.name || "—"}</strong></div>
              </div>

              <div className="redeem-preview__items">
                <h2>Itens comprados</h2>
                {(preview?.items || []).map((row) => (
                  <div className="redeem-preview__item" key={`${row.item_id}-${row.name}`}>
                    <span><strong>{row.quantity}×</strong> {row.name}</span><strong>{money(row.subtotal)}</strong>
                  </div>
                ))}
              </div>

              {preview?.delivery_address && <div className="redeem-preview__note"><small>Endereço de entrega</small><strong>{preview.delivery_address}</strong></div>}
              {preview?.notes && <div className="redeem-preview__note"><small>Observações do cliente</small><strong>{preview.notes}</strong></div>}

              {!fulfilled && <Alert variant="warning" className="text-start mt-3">Confira cliente, estabelecimento, itens e quantidades. Só confirme depois de entregar fisicamente os produtos ou concluir a entrega.</Alert>}

              <div className="commerce-actions justify-content-center">
                {!fulfilled && <Button size="lg" disabled={processing} onClick={redeem}>{processing ? <><Spinner size="sm" /> Registrando…</> : actionLabel}</Button>}
                <Button variant="outline-light" onClick={() => navigate("/orders/scan")}>Ler outro QR</Button>
                <Button variant="outline-light" onClick={() => navigate("/orders/manage")}>Pedidos recebidos</Button>
              </div>

              {history.length > 0 && <div className="fulfillment-history text-start"><h3><FaHistory /> Histórico de validação</h3>{history.map((event) => <div className="fulfillment-history__item" key={event.id}><div><strong>{event.event}</strong><small>{event.from_status || "—"} → {event.to_status || "—"}{event.actor?.user_name || event.actor?.first_name ? ` · ${event.actor.user_name || event.actor.first_name}` : ""}</small></div><small>{event.created_at ? new Date(event.created_at).toLocaleString("pt-BR") : ""}</small></div>)}</div>}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
