// src/components/order/steps/OrderStepTime.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import "./OrderStepTime.css";

export default function OrderStepTime({
  availableTimes = [],
  selected = null,
  onChange,
}) {
  const times = useMemo(
    () => [...new Set(availableTimes)],
    [availableTimes]
  );

  return (
    <div className="order-step-container">
      <h4>Escolha o Horário</h4>

      <div className="order-step-times">
        {times.length ? (
          times.map((t) => (
            <button
              key={t}
              type="button"
              className={`order-step-time-btn ${
                selected === t ? "active" : ""
              }`}
              onClick={() => onChange(t)}
            >
              {t}
            </button>
          ))
        ) : (
          <div className="order-step-empty">
            Nenhum horário disponível para esta data
          </div>
        )}
      </div>
    </div>
  );
}

OrderStepTime.propTypes = {
  availableTimes: PropTypes.array.isRequired,
  selected: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};
