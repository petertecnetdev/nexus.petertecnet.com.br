// src/components/order/steps/OrderStepServices.jsx
import React from "react";
import PropTypes from "prop-types";
import GlobalModal from "../../GlobalModal";
import "./OrderStepServices.css";

export default function OrderStepServices({
  services = [],
  selected = [],
  onChange,
}) {
  const isSelected = (id) =>
    selected.some((s) => (s.id || s.item_id) === id);

  const addService = (service) => {
    GlobalModal.open({
      title: "Adicionar serviço",
      html: `<strong>${service.name}</strong><br/>Deseja adicionar este serviço ao agendamento?`,
      confirmText: "Adicionar",
      cancelText: "Cancelar",
      onConfirm: () => {
        onChange([...selected, service]);
        GlobalModal.close();
      },
    });
  };

  const removeService = (service) => {
    GlobalModal.open({
      title: "Remover serviço",
      html: `<strong>${service.name}</strong><br/>Deseja remover este serviço do agendamento?`,
      confirmText: "Remover",
      cancelText: "Cancelar",
      onConfirm: () => {
        onChange(
          selected.filter(
            (s) => (s.id || s.item_id) !== (service.id || service.item_id)
          )
        );
        GlobalModal.close();
      },
    });
  };

  const toggleService = (service) => {
    const id = service.id || service.item_id;
    if (isSelected(id)) {
      removeService(service);
    } else {
      addService(service);
    }
  };

  const fmtBRL = (v) =>
    `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

  return (
    <div className="order-step-container">
      <h4>Escolha os Serviços</h4>

      <div className="order-step-grid">
        {services && services.length ? (
          services.map((s) => {
            const id = s.id || s.item_id;
            const active = isSelected(id);

            return (
              <div
                key={id}
                className={`order-step-card ${active ? "active" : ""}`}
                onClick={() => toggleService(s)}
              >
                <div className="order-step-name">{s.name}</div>

                <div className="order-step-price">
                  {fmtBRL(s.price)}
                </div>

                <div className="order-step-duration">
                  {s.duration || 30} min
                </div>
              </div>
            );
          })
        ) : (
          <div className="order-step-empty">
            Nenhum serviço disponível
          </div>
        )}
      </div>
    </div>
  );
}

OrderStepServices.propTypes = {
  services: PropTypes.array.isRequired,
  selected: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
