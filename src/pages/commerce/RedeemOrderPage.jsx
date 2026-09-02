import React, { useContext, useEffect, useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { FaCheckCircle, FaQrcode } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import { redeemCommerceOrder } from "../../services/commerce";
import "./Commerce.css";

export default function RedeemOrderPage() {
  const { publicId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const queryToken = new URLSearchParams(location.search).get("token") || "";
  const [token, setToken] = useState(queryToken);
  const [processing, setProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const redeem = async () => {
    if (!token || processing) return;
    setProcessing(true); setError("");
    try {
      const response = await redeemCommerceOrder(publicId, token);
      setResult(response?.data || null);
    } catch (requestError) {
      setError(requestError?.response?.data?.message || "Não foi possível validar este QR Code.");
    } finally { setProcessing(false); }
  };

  useEffect(() => {
    if (user && queryToken && !result && !processing) redeem();
    // executa automaticamente quando o vendedor abre o link vindo do QR.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, queryToken]);

  return <div className="commerce-page"><GlobalNav /><Container className="commerce-shell"><div className="commerce-card redeem-result">
    <FaQrcode size={42} />
    <div className="commerce-heading"><span>Validação</span><h1>Validar compra</h1><p>Este QR só pode ser consumido uma vez pelo estabelecimento responsável.</p></div>
    {!user && <Alert variant="info">Entre na conta vinculada ao estabelecimento para validar esta compra.</Alert>}
    {error && <Alert variant="danger">{error}</Alert>}
    {result ? <><FaCheckCircle size={46} /><h2 className="mt-3">Compra validada</h2><p>{result.fulfillment === "delivery" ? "Entrega confirmada com sucesso." : "Retirada confirmada com sucesso."}</p><Button onClick={() => navigate("/orders/manage")}>Voltar aos pedidos</Button></> : <>
      <Form.Group className="mb-3 text-start"><Form.Label>Token da compra</Form.Label><Form.Control value={token} onChange={(e) => setToken(e.target.value)} placeholder="O token é preenchido automaticamente ao abrir o QR" /><div className="redeem-token-preview mt-2">Pedido: {publicId}</div></Form.Group>
      {!user ? <Button onClick={() => navigate("/login", { state: { from: { pathname: `${location.pathname}${location.search}` } } })}>Entrar para validar</Button> : <Button disabled={!token || processing} onClick={redeem}>{processing ? <><Spinner size="sm" /> Validando…</> : "Confirmar retirada/entrega"}</Button>}
    </>}
  </div></Container></div>;
}
