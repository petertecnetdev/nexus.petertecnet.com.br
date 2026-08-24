// src/components/order/OrderWizardModal.jsx
import React, { useEffect, useMemo, useState } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";
import GlobalModal from "../GlobalModal";
import GlobalDateCarousel from "../GlobalDateCarousel";
import { apiBaseUrl } from "../../config";
import "./OrderWizardModal.css";

dayjs.extend(utc);
dayjs.extend(tz);

export default function OrderWizardModal({
  open = false,
  onClose,
  services = [],
  employers = [],
  loadAvailableTimes,
  imageUrl,
  establishment = null,
  preselectedItem = null,
  preselectedEmployer = null,
}) {
  const [step, setStep] = useState(1);
  const [selectedServices, setSelectedServices] = useState([]);
  const [selectedEmployer, setSelectedEmployer] = useState(null);
  const [selectedDate, setSelectedDate] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [customerCpf, setCustomerCpf] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const hasPreselectedEmployer = !!preselectedEmployer;

  useEffect(() => {
    if (!open) return;

    setStep(1);
    setSelectedServices(preselectedItem ? [preselectedItem] : []);
    setSelectedEmployer(preselectedEmployer || null);
    setSelectedDate(null);
    setAvailableTimes([]);
    setSelectedTime(null);
    setLoading(false);

    const userData = localStorage.getItem("user");
    if (userData) {
      try {
        const parsed = JSON.parse(userData);
        const profile = parsed.profile || {};
        setCustomerCpf(profile.cpf || parsed.cpf || "");
        setCustomerPhone(profile.phone || parsed.phone || "");
      } catch {
        setCustomerCpf("");
        setCustomerPhone("");
      }
    } else {
      setCustomerCpf("");
      setCustomerPhone("");
    }
  }, [open, preselectedItem, preselectedEmployer]);

  const totalDuration = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (parseInt(s.duration, 10) || 30),
        0
      ),
    [selectedServices]
  );

  const totalValue = useMemo(
    () =>
      selectedServices.reduce(
        (sum, s) => sum + (parseFloat(s.price) || 0),
        0
      ),
    [selectedServices]
  );

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const toggleService = (service) => {
    const id = service.id || service.item_id;
    setSelectedServices((prev) => {
      const exists = prev.some((s) => (s.id || s.item_id) === id);
      return exists
        ? prev.filter((s) => (s.id || s.item_id) !== id)
        : [...prev, service];
    });
  };

  const next = async () => {
    if (loading) return;

    if (step === 1) {
      if (!selectedServices.length) return;
      setStep(2);
      return;
    }

    if (!hasPreselectedEmployer && step === 2) {
      if (!selectedEmployer) return;
      setStep(3);
      return;
    }

    if (step === (hasPreselectedEmployer ? 2 : 3)) {
      if (!selectedDate) return;
      try {
        setLoading(true);
        const dateSP = dayjs(selectedDate).format("YYYY-MM-DD");
        const times = await loadAvailableTimes(
          dateSP,
          selectedEmployer || preselectedEmployer,
          totalDuration
        );
        setAvailableTimes(Array.isArray(times) ? times : []);
        setStep(step + 1);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      if (!selectedTime) return;
      setStep(step + 1);
      return;
    }

    if (step === (hasPreselectedEmployer ? 4 : 5)) {
      if (!customerCpf || !customerPhone) {
        GlobalModal.open({
          title: "Dados obrigatórios",
          html: "Informe CPF e telefone para continuar.",
          confirmText: "Ok",
          showCancel: false,
        });
        return;
      }

      try {
        setLoading(true);

        const dateBase =
          typeof selectedDate === "string"
            ? selectedDate
            : dayjs(selectedDate).format("YYYY-MM-DD");

        const datetimeSP = dayjs.tz(
          `${dateBase} ${selectedTime}`,
          "YYYY-MM-DD HH:mm",
          "America/Sao_Paulo"
        );

        let customerName = "Cliente App";
        let clientId = null;
        const userData = localStorage.getItem("user");
        if (userData) {
          const parsed = JSON.parse(userData);
          clientId = parsed.id || null;
          customerName =
            `${parsed.first_name || ""} ${parsed.last_name || ""}`.trim() ||
            parsed.user_name ||
            customerName;
        }

        const entityId =
          establishment?.id ||
          selectedEmployer?.establishment_id ||
          preselectedEmployer?.establishment_id ||
          null;

        const payload = {
          mode: "order",
          app_id: establishment?.app_id || 2,
          entity_name: "establishment",
          entity_id: entityId,
          items: selectedServices.map((s) => ({
            item_id: s.id || s.item_id,
            quantity: 1,
          })),
          client_id: clientId,
          customer_name: customerName,
          customer_phone: customerPhone,
          customer_cpf: customerCpf,
          origin: "App",
          fulfillment: "appointment",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Ordem de serviço agendada pelo app.",
          order_datetime: datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ"),
          attendant_id: selectedEmployer?.id || preselectedEmployer?.id,
        };

        const token = localStorage.getItem("token");
        const res = await fetch(`${apiBaseUrl}/order`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            Authorization: token ? `Bearer ${token}` : "",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();

        if (res.ok) {
          GlobalModal.open({
            title: "Pedido criado",
            html: "Sua ordem de serviço foi agendada com sucesso.",
            confirmText: "Fechar",
            showCancel: false,
            onConfirm: onClose,
          });
        } else {
          GlobalModal.open({
            title: "Erro",
            html: data?.message || "Não foi possível criar o pedido.",
            confirmText: "Ok",
            showCancel: false,
          });
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const back = () => setStep((s) => Math.max(1, s - 1));

  const steps = hasPreselectedEmployer ? 4 : 5;

  if (!open) return null;

  GlobalModal.open({
    title: "Agendar Ordem de Serviço",
    width: 900,
    showCancel: true,
    cancelText: "Cancelar",
    confirmText:
      step === steps ? "Confirmar" : loading ? "Carregando..." : "Avançar",
    onCancel: onClose,
    onConfirm: next,
    html: (
      <div className="order-wizard">
        {step === 1 && (
          <div className="wizard-step">
            <h4>Serviços</h4>
            <div className="grid">
              {services.map((s) => {
                const id = s.id || s.item_id;
                const active = selectedServices.some(
                  (x) => (x.id || x.item_id) === id
                );
                return (
                  <div
                    key={id}
                    className={`card ${active ? "active" : ""}`}
                    onClick={() => toggleService(s)}
                  >
                    <div>{s.name}</div>
                    <small>{fmtBRL(s.price)}</small>
                    <small>{s.duration || 30} min</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasPreselectedEmployer && step === 2 && (
          <div className="wizard-step">
            <h4>Profissional</h4>
            <div className="grid">
              {employers.map((e) => (
                <div
                  key={e.id}
                  className={`card ${
                    selectedEmployer?.id === e.id ? "active" : ""
                  }`}
                  onClick={() => setSelectedEmployer(e)}
                >
                  <img
                    src={imageUrl(e.user?.avatar)}
                    onError={(ev) =>
                      (ev.currentTarget.src = "/images/logo.png")
                    }
                    alt={e.user?.first_name}
                  />
                  <div>{e.user?.first_name}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === (hasPreselectedEmployer ? 2 : 3) && (
          <div className="wizard-step">
            <h4>Data</h4>
            <GlobalDateCarousel
              selectedDate={selectedDate}
              onChange={(d) =>
                setSelectedDate(dayjs(d).format("YYYY-MM-DD"))
              }
              daysToShow={14}
            />
          </div>
        )}

        {step === (hasPreselectedEmployer ? 3 : 4) && (
          <div className="wizard-step">
            <h4>Horário</h4>
            <div className="times">
              {availableTimes.map((t) => (
                <button
                  key={t}
                  className={selectedTime === t ? "active" : ""}
                  onClick={() => setSelectedTime(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === steps && (
          <div className="wizard-step">
            <h4>Confirmação</h4>
            <p>
              <b>Profissional:</b>{" "}
              {selectedEmployer?.user?.first_name ||
                preselectedEmployer?.user?.first_name}
            </p>
            <p>
              <b>Data:</b>{" "}
              {selectedDate
                ? selectedDate.split("-").reverse().join("/")
                : "-"}
            </p>
            <p>
              <b>Horário:</b> {selectedTime}
            </p>
            <ul>
              {selectedServices.map((s) => (
                <li key={s.id || s.item_id}>
                  {s.name} - {fmtBRL(s.price)}
                </li>
              ))}
            </ul>
            <p>
              <b>Total:</b> {fmtBRL(totalValue)} | <b>Duração:</b>{" "}
              {totalDuration} min
            </p>
            <div className="row">
              <input
                placeholder="CPF"
                value={customerCpf}
                onChange={(e) => setCustomerCpf(e.target.value)}
              />
              <input
                placeholder="Telefone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
              />
            </div>
          </div>
        )}

        {step > 1 && (
          <button className="back-btn" onClick={back}>
            Voltar
          </button>
        )}
      </div>
    ),
  });

  return null;
}