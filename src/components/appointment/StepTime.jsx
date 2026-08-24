import React from "react";
import "./steps.css";

export default function StepTime({ availableTimes, selected, onChange }) {
  const uniqueTimes = [...new Set(availableTimes)];

  return (
    <div className="step-container">
      <h4>Escolha o Horário</h4>
      <div className="step-times">
        {uniqueTimes.length ? (
          uniqueTimes.map((t) => (
            <button
              key={t}
              onClick={() => onChange(t)}
              className={`step-time-btn ${selected === t ? "active" : ""}`}
            >
              {t}
            </button>
          ))
        ) : (
          <div className="step-empty">Nenhum horário disponível</div>
        )}
      </div>
    </div>
  );
}
