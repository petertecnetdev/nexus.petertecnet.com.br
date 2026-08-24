// src/components/order/steps/OrderStepConfirm.jsx
import React, { useEffect } from "react";
import PropTypes from "prop-types";
import dayjs from "dayjs";
import tz from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";
import "./OrderStepConfirm.css";

dayjs.extend(utc);
dayjs.extend(tz);

export default function OrderStepConfirm({
  services = [],
  employer = null,
  date,
  time,
  total = 0,
  duration = 0,
  customerCpf,
  customerPhone,
  onCpfChange,
  onPhoneChange,
}) {
  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  let formattedDate = "";
  try {
    if (date) {
      const [y, m, d] = date.split("-");
      const localDate = new Date(Number(y), Number(m) - 1, Number(d));
      formattedDate = localDate.toLocaleDateString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });
    }
  } catch {}

  useEffect(() => {
    console.log("[OrderStepConfirm]", {
      date,
      time,
      formattedDate,
      timezone: dayjs.tz.guess(),
    });
  }, [date, time, formattedDate]);

  return (
    <div className="order-step-container">
      <h4>Confirmar Ordem de Serviço</h4>

      <div className="order-confirm-box">
        <p>
          <b>Profissional:</b>{" "}
          {employer?.user?.first_name || "—"}
        </p>

        <p>
          <b>Data:</b> {formattedDate || "—"}
        </p>

        <p>
          <b>Horário:</b> {time || "—"}
        </p>

        <ul className="order-confirm-services">
          {services.map((s) => (
            <li key={s.id || s.item_id}>
              {s.name} — {fmtBRL(s.price)}
            </li>
          ))}
        </ul>

        <hr />

        <p>
          <b>Total:</b> {fmtBRL(total)} |{" "}
          <b>Duração:</b> {duration} min
        </p>

        <div className="order-confirm-inputs">
          <input
            type="text"
            placeholder="CPF"
            value={customerCpf}
            onChange={(e) => onCpfChange(e.target.value)}
          />

          <input
            type="text"
            placeholder="Telefone"
            value={customerPhone}
            onChange={(e) => onPhoneChange(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}

OrderStepConfirm.propTypes = {
  services: PropTypes.array.isRequired,
  employer: PropTypes.object,
  date: PropTypes.string,
  time: PropTypes.string,
  total: PropTypes.number.isRequired,
  duration: PropTypes.number.isRequired,
  customerCpf: PropTypes.string.isRequired,
  customerPhone: PropTypes.string.isRequired,
  onCpfChange: PropTypes.func.isRequired,
  onPhoneChange: PropTypes.func.isRequired,
};
