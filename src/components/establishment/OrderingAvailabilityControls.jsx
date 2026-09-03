import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { getOrderingSettings, updateOrderingSettings } from "../../services/ordering";
import "./OrderingAvailabilityControls.css";

const PAYMENT_OPTIONS = [
  { value: "pix", label: "Pix", hint: "Pagamento instantâneo por QR Code ou copia e cola." },
  { value: "cash", label: "Dinheiro", hint: "Pagamento em dinheiro no atendimento ou na entrega." },
  { value: "card_on_delivery", label: "Cartão no atendimento/entrega", hint: "Cartão presencial, sem cobrar online no catálogo." },
];

export default function OrderingAvailabilityControls({ establishmentId }) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    getOrderingSettings(establishmentId)
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((requestError) => {
        if (active) setError(requestError?.response?.data?.message || "Não foi possível carregar as configurações de compra.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [establishmentId]);

  const toggleMethod = (method) => {
    setSettings((current) => {
      const methods = Array.isArray(current?.payment_methods) ? current.payment_methods : [];
      const nextMethods = methods.includes(method)
        ? methods.filter((value) => value !== method)
        : [...methods, method];
      return { ...current, payment_methods: nextMethods };
    });
  };

  const save = async () => {
    if (!settings || saving) return;
    setSaving(true);
    setError("");
    try {
      const data = await updateOrderingSettings(establishmentId, {
        ordering_enabled: Boolean(settings.ordering_enabled),
        accepting_orders: Boolean(settings.accepting_orders),
        payment_methods: Array.isArray(settings.payment_methods) ? settings.payment_methods : [],
      });
      setSettings(data);
      await Swal.fire("Configurações atualizadas", "A disponibilidade de compras e pagamentos foi salva.", "success");
    } catch (requestError) {
      const message = requestError?.response?.data?.message || "Não foi possível salvar as configurações de compra.";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <section className="eup-section ordering-controls"><Spinner size="sm" /> Carregando disponibilidade de compras…</section>;

  const paymentMethods = Array.isArray(settings?.payment_methods) ? settings.payment_methods : [];

  return (
    <section className="eup-section ordering-controls" aria-labelledby="ordering-availability-title">
      <div className="eup-section__heading">
        <h3 id="ordering-availability-title">Compras e pagamentos</h3>
        <p>Controle a operação sem apagar produtos. O catálogo pode continuar visível mesmo quando as compras estiverem pausadas.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {settings && (
        <div className="ordering-controls__body">
          <div className="ordering-controls__group" aria-label="Disponibilidade das compras">
            <Form.Check
              className="ordering-toggle"
              type="switch"
              id="ordering-enabled"
              label="Permitir compras online"
              checked={Boolean(settings.ordering_enabled)}
              onChange={(event) => setSettings((current) => ({ ...current, ordering_enabled: event.target.checked }))}
            />
            <Form.Check
              className="ordering-toggle"
              type="switch"
              id="accepting-orders"
              label="Receber novas compras agora"
              checked={Boolean(settings.accepting_orders)}
              disabled={!settings.ordering_enabled}
              onChange={(event) => setSettings((current) => ({ ...current, accepting_orders: event.target.checked }))}
            />
          </div>

          <div className="ordering-controls__payments">
            <div className="ordering-controls__subheading">
              <strong>Formas de pagamento</strong>
              <small>{paymentMethods.length ? `${paymentMethods.length} ativa${paymentMethods.length > 1 ? "s" : ""}` : "Nenhuma ativa"}</small>
            </div>
            <div className="ordering-controls__group">
              {PAYMENT_OPTIONS.map((option) => (
                <div className="ordering-payment" key={option.value}>
                  <div className="ordering-payment__copy">
                    <strong>{option.label}</strong>
                    <small>{option.hint}</small>
                  </div>
                  <Form.Check
                    className="ordering-toggle ordering-toggle--standalone"
                    type="switch"
                    id={`payment-${option.value}`}
                    aria-label={`Ativar ${option.label}`}
                    checked={paymentMethods.includes(option.value)}
                    onChange={() => toggleMethod(option.value)}
                  />
                </div>
              ))}
            </div>
          </div>

          {paymentMethods.length === 0 && (
            <Alert variant="warning" className="mb-0">Sem forma de pagamento ativa, o catálogo fica somente para consulta e o cliente não consegue iniciar uma compra.</Alert>
          )}

          <Button className="ordering-controls__save" type="button" onClick={save} disabled={saving}>
            {saving ? "Salvando…" : "Salvar compras e pagamentos"}
          </Button>
        </div>
      )}
    </section>
  );
}
