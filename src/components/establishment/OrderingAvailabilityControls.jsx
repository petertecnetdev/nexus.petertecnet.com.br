import React, { useEffect, useState } from "react";
import { Alert, Button, Form, Spinner } from "react-bootstrap";
import Swal from "sweetalert2";
import { getOrderingSettings, updateOrderingSettings } from "../../services/ordering";

const PAYMENT_OPTIONS = [
  { value: "pix", label: "Pix" },
  { value: "cash", label: "Dinheiro" },
  { value: "card_on_delivery", label: "Cartão no atendimento/entrega" },
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

  if (loading) return <section className="eup-section"><Spinner size="sm" /> Carregando disponibilidade de compras…</section>;

  return (
    <section className="eup-section" aria-labelledby="ordering-availability-title">
      <div className="eup-section__heading">
        <h3 id="ordering-availability-title">Compras e pagamentos</h3>
        <p>Desative compras ou formas de pagamento sem apagar nenhum produto. Sem forma de pagamento ativa, o cliente não consegue adicionar itens ao carrinho nem iniciar uma compra.</p>
      </div>

      {error && <Alert variant="danger">{error}</Alert>}

      {settings && (
        <div className="d-grid gap-3">
          <Form.Check
            type="switch"
            id="ordering-enabled"
            label="Permitir compras online"
            checked={Boolean(settings.ordering_enabled)}
            onChange={(event) => setSettings((current) => ({ ...current, ordering_enabled: event.target.checked }))}
          />
          <Form.Check
            type="switch"
            id="accepting-orders"
            label="Receber novas compras agora"
            checked={Boolean(settings.accepting_orders)}
            disabled={!settings.ordering_enabled}
            onChange={(event) => setSettings((current) => ({ ...current, accepting_orders: event.target.checked }))}
          />

          <div>
            <strong>Formas de pagamento ativas</strong>
            <div className="d-grid gap-2 mt-2">
              {PAYMENT_OPTIONS.map((option) => (
                <Form.Check
                  key={option.value}
                  type="switch"
                  id={`payment-${option.value}`}
                  label={option.label}
                  checked={Array.isArray(settings.payment_methods) && settings.payment_methods.includes(option.value)}
                  onChange={() => toggleMethod(option.value)}
                />
              ))}
            </div>
          </div>

          {Array.isArray(settings.payment_methods) && settings.payment_methods.length === 0 && (
            <Alert variant="warning" className="mb-0">Nenhuma forma de pagamento está ativa. O catálogo continua visível, mas fica somente para consulta.</Alert>
          )}

          <div>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? "Salvando…" : "Salvar compras e pagamentos"}
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
