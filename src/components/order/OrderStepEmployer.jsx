// src/components/order/steps/OrderStepEmployer.jsx
import React from "react";
import PropTypes from "prop-types";
import "./OrderStepEmployer.css";

export default function OrderStepEmployer({
  employers = [],
  selected = null,
  onChange,
  imageUrl,
}) {
  return (
    <div className="order-step-container">
      <h4>Escolha o Profissional</h4>

      <div className="order-step-grid">
        {employers && employers.length ? (
          employers.map((e) => {
            const active = selected?.id === e.id;

            return (
              <div
                key={e.id}
                className={`order-step-card ${active ? "active" : ""}`}
                onClick={() => onChange(e)}
              >
                <img
                  src={imageUrl ? imageUrl(e.user?.avatar) : e.user?.avatar}
                  alt={e.user?.first_name}
                  className="order-step-avatar"
                  onError={(ev) =>
                    (ev.currentTarget.src = "/images/logo.png")
                  }
                />

                <div className="order-step-name">
                  {e.user?.first_name || "Profissional"}
                </div>
              </div>
            );
          })
        ) : (
          <div className="order-step-empty">
            Nenhum profissional disponível
          </div>
        )}
      </div>
    </div>
  );
}

OrderStepEmployer.propTypes = {
  employers: PropTypes.array.isRequired,
  selected: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  imageUrl: PropTypes.func,
};
