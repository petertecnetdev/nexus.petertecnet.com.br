import React from "react";
import GlobalModal from "../GlobalModal";
import "./steps.css";

export default function StepServices({ services = [], selected = [], onChange }) {
  const isSelected = (id) => selected.some((x) => x.id === id);

  const addService = (service) => {
    GlobalModal.open({
      title: "Adicionar serviço",
      html: `<strong>${service.name}</strong><br/>Deseja adicionar este serviço?`,
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
      html: `<strong>${service.name}</strong><br/>Deseja remover este serviço?`,
      confirmText: "Remover",
      cancelText: "Cancelar",
      onConfirm: () => {
        onChange(selected.filter((x) => x.id !== service.id));
        GlobalModal.close();
      },
    });
  };

  const toggle = (service) => {
    if (isSelected(service.id)) {
      removeService(service);
    } else {
      addService(service);
    }
  };

  return (
    <div className="step-container">
      <h4>Escolha os Serviços</h4>

      <div className="step-grid">
        {services.map((s) => {
          const active = isSelected(s.id);

          return (
            <div
              key={s.id}
              className={`step-card ${active ? "active" : ""}`}
              onClick={() => toggle(s)}
            >
              <div className="step-name">{s.name}</div>

              <div className="step-price">
                R$ {Number(s.price).toFixed(2).replace(".", ",")}
              </div>

              <div className="step-duration">
                {s.duration || 30} min
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
