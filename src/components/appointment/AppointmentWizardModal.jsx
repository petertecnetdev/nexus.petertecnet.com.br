// src/components/appointment/AppointmentWizardModal.jsx
import React, { useState, useMemo, useEffect, useCallback } from "react";
import { Modal, Button, Form, Row, Col } from "react-bootstrap";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import GlobalDateCarousel from "../GlobalDateCarousel";
import { apiBaseUrl } from "../../config";
import useImageUtils from "../../hooks/useImageUtils";
import "./AppointmentWizardModal.css";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import tz from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(tz);

const MySwal = withReactContent(Swal);

const buildInitialsSvg = (name = "?") => {
  const parts = name.trim().split(" ").filter(Boolean);
  const initials =
    parts.length === 1
      ? parts[0][0]?.toUpperCase()
      : (parts[0][0] + parts.at(-1)[0]).toUpperCase();

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#0b1c2d"/>
          <stop offset="100%" stop-color="#020617"/>
        </linearGradient>
      </defs>
      <rect width="200" height="200" rx="100" ry="100" fill="url(#g)"/>
      <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-size="64" font-weight="700" fill="#e5e7eb"
        font-family="Inter, Arial, sans-serif" letter-spacing="2">
        ${initials || "?"}
      </text>
    </svg>
  `;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export default function AppointmentWizardModal({
  show,
  onHide,
  employers = [],
  services = [],
  loadAvailableTimes,
  imageUrl,
  preselectedService = null,
  preselectedEmployer = null,
  establishment = null,
}) {
  const { imageUrl: imgUrl } = useImageUtils();

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
  const finalStep = hasPreselectedEmployer ? 4 : 5;

  useEffect(() => {
    if (!show) return;

    setStep(1);

    if (preselectedService && services.length) {
      const sid = preselectedService.id || preselectedService.item_id;
      const serviceFromList = services.find(
        (s) => (s.id || s.item_id) === sid
      );
      setSelectedServices(serviceFromList ? [serviceFromList] : []);
    } else {
      setSelectedServices([]);
    }

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
  }, [show, preselectedService, preselectedEmployer, services]);

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
      selectedServices.reduce((sum, s) => sum + (parseFloat(s.price) || 0), 0),
    [selectedServices]
  );

  const handleServiceToggle = useCallback((service) => {
    const id = service.id || service.item_id;
    setSelectedServices((prev) => {
      const exists = prev.some((s) => (s.id || s.item_id) === id);
      if (exists) {
        return prev.filter((s) => (s.id || s.item_id) !== id);
      }
      return [...prev, service];
    });
  }, []);

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  const resolveImage = useCallback(
    (entity, name) => {
      const paths = [
        entity?.image,
        entity?.avatar,
        entity?.images?.avatar,
        entity?.images?.logo,
        Array.isArray(entity?.files)
          ? entity.files.find((f) => f.type === "image")?.public_url
          : null,
      ];

      for (const p of paths) {
        const url = imageUrl ? imageUrl(p) : imgUrl(p);
        if (url) return url;
      }

      return buildInitialsSvg(name);
    },
    [imageUrl, imgUrl]
  );

  const handleNext = async () => {
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
        setStep((prev) => prev + 1);
      } finally {
        setLoading(false);
      }
      return;
    }

    if (step === (hasPreselectedEmployer ? 3 : 4)) {
      if (!selectedTime) return;
      setStep(finalStep);
      return;
    }

    if (step === finalStep) {
      if (!customerCpf || !customerPhone) {
        MySwal.fire({
          icon: "warning",
          title: "Preencha os campos",
          text: "Informe seu CPF e telefone para continuar.",
          background: "#0a0a0c",
          color: "#fff",
          confirmButtonColor: "#00bcd4",
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

        const userData = localStorage.getItem("user");
        const parsed = userData ? JSON.parse(userData) : null;

        const payload = {
          mode: "appointment",
          app_id: establishment?.app_id || 2,
          entity_name: "establishment",
          entity_id: establishment?.id,
          items: selectedServices.map((s) => ({
            item_id: s.id || s.item_id,
            quantity: 1,
          })),
          client_id: parsed?.id || null,
          customer_name:
            `${parsed?.first_name || ""} ${parsed?.last_name || ""}`.trim() ||
            "Cliente App",
          customer_phone: customerPhone,
          customer_cpf: customerCpf,
          origin: "App",
          fulfillment: "dine-in",
          payment_status: "pending",
          payment_method: "Pix",
          notes: "Agendamento feito pelo aplicativo.",
          order_datetime: datetimeSP.format("YYYY-MM-DDTHH:mm:ssZ"),
          attendant_id:
            selectedEmployer?.id || preselectedEmployer?.id || null,
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
        if (!res.ok) throw data;

        await MySwal.fire({
          icon: "success",
          title: "Agendamento registrado com sucesso!",
          background: "#0a0a0c",
          color: "#fff",
          confirmButtonColor: "#00bcd4",
        });

        onHide();
      } catch (e) {
        MySwal.fire({
          icon: "error",
          title: "Erro ao agendar",
          text: e?.message || "Não foi possível criar o agendamento.",
          background: "#0a0a0c",
          color: "#fff",
          confirmButtonColor: "#00bcd4",
        });
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => setStep((s) => Math.max(1, s - 1));

  return (
    <Modal show={show} onHide={onHide} centered size="lg" backdrop="static">
      <Modal.Body>
        {step === 1 && (
          <div className="wizard-step">
            <h4>Escolha os Serviços</h4>
            <div className="grid">
              {services.map((s) => {
                const id = s.id || s.item_id;
                const active = selectedServices.some(
                  (x) => (x.id || x.item_id) === id
                );
                return (
                  <div
                    key={id}
                    className={`card-service ${active ? "active" : ""}`}
                    onClick={() => handleServiceToggle(s)}
                  >
                    <img
                      src={resolveImage(s, s.name)}
                      alt={s.name}
                      className="service-img"
                    />
                    <h5   className="text-white">{s.name}</h5>
                    <p>{fmtBRL(s.price)}</p>
                    <small>{s.duration || 30} min</small>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!hasPreselectedEmployer && step === 2 && (
          <div className="wizard-step">
            <h4 className="text-white">Escolha o Profissional</h4>
            <div className="grid">
              {employers.map((e) => {
                const active = selectedEmployer?.id === e.id;
                return (
                  <div
                    key={e.id}
                    className={`card-emp ${active ? "active" : ""}`}
                    onClick={() => setSelectedEmployer(e)}
                  >
                    <img
                      src={resolveImage(e, e.name)}
                      alt={e.name}
                      className="emp-avatar"
                    />
                    <strong>{e.name}</strong>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {step === (hasPreselectedEmployer ? 2 : 3) && (
          <GlobalDateCarousel
            selectedDate={selectedDate}
            onChange={setSelectedDate}
            daysToShow={14}
          />
        )}

        {step === (hasPreselectedEmployer ? 3 : 4) && (
          <div className="grid-times">
            {availableTimes.map((t) => (
              <button
                key={t}
                type="button"
                className={`time-btn ${selectedTime === t ? "active" : ""}`}
                onClick={() => setSelectedTime(t)}
              >
                {t}
              </button>
            ))}
          </div>
        )}

        {step === finalStep && (
          <div>
            <p>
              <b>Total:</b> {fmtBRL(totalValue)} | <b>Duração:</b>{" "}
              {totalDuration} min
            </p>
            <Form>
              <Row>
                <Col>
                  <Form.Control
                    value={customerCpf}
                    onChange={(e) => setCustomerCpf(e.target.value)}
                    placeholder="CPF"
                  />
                </Col>
                <Col>
                  <Form.Control
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Telefone"
                  />
                </Col>
              </Row>
            </Form>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer>
        <Button onClick={onHide}>Cancelar</Button>
        {step > 1 && <Button onClick={handleBack}>Voltar</Button>}
        <Button onClick={handleNext} disabled={loading}>
          {step === finalStep ? "Confirmar" : "Avançar"}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
