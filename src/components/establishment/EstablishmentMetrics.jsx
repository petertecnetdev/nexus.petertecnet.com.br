import React from "react";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";
import "./EstablishmentMetrics.css";

export default function EstablishmentMetrics({ metrics }) {
  if (!metrics) return null;

  const isValid = (v) =>
    v !== null &&
    v !== undefined &&
    v !== "" &&
    v !== "null" &&
    !(typeof v === "number" && isNaN(v));

  return (
    <Card className="est-card m-3">
      <Card.Header>📊 Métricas do Estabelecimento</Card.Header>
      <Card.Body className="text-white">

        {/* === 🧩 Estrutura Geral === */}
        <h6 className="text-info mb-2">📦 Estrutura Geral</h6>
        {[
          ["total_items", "Itens Cadastrados"],
          ["total_employers", "Colaboradores"],
          ["total_orders", "Pedidos Realizados"],
          ["completed_orders", "Pedidos Concluídos"],
          ["cancelled_orders", "Pedidos Cancelados"],
          ["pending_orders", "Pedidos Pendentes"],
        ]
          .filter(([key]) => isValid(metrics[key]))
          .map(([key, label]) => (
            <div key={key} className="d-flex justify-content-between mb-2">
              <span>{label}</span>
              <strong>{metrics[key]}</strong>
            </div>
          ))}

        <hr className="border-secondary" />

        {/* === 👁️ Engajamento === */}
        <h6 className="text-warning mb-2">👁️ Engajamento</h6>
        {[
          ["total_views", "Total de Visualizações"],
          ["unique_users", "Usuários Únicos"],
          ["avg_views_per_user", "Média de Views por Usuário"],
          ["avg_views_per_item", "Média de Views por Item"],
          ["avg_views_per_employer", "Média de Views por Colaborador"],
          ["avg_employer_views", "Visualizações por Colaborador"],
          ["avg_views_per_day", "Views Médias por Dia"],
          ["days_active", "Dias Ativo"],
          ["engagement_score", "Pontuação de Engajamento"],
        ]
          .filter(([key]) => isValid(metrics[key]))
          .map(([key, label]) => (
            <div key={key} className="d-flex justify-content-between mb-2">
              <span>{label}</span>
              <strong>
                {typeof metrics[key] === "number"
                  ? metrics[key].toLocaleString("pt-BR", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 2,
                    })
                  : metrics[key]}
              </strong>
            </div>
          ))}

        <hr className="border-secondary" />

        {/* === 📈 Taxas === */}
        <h6 className="text-primary mb-2">📈 Taxas e Desempenho</h6>
        {[
          ["completion_rate", "Taxa de Conclusão (%)"],
          ["cancellation_rate", "Taxa de Cancelamento (%)"],
          ["pending_rate", "Pedidos Pendentes (%)"],
          ["efficiency_rate", "Eficiência Operacional (%)"],
          ["return_rate", "Clientes Recorrentes (%)"],
        ]
          .filter(([key]) => isValid(metrics[key]))
          .map(([key, label]) => (
            <div key={key} className="mb-3">
              <div className="d-flex justify-content-between">
                <span>{label}</span>
                <span>{metrics[key]}%</span>
              </div>
              <div className="progress progress-sm bg-secondary">
                <div
                  className={`progress-bar ${
                    key.includes("cancel") ? "bg-danger" :
                    key.includes("return") ? "bg-warning" :
                    key.includes("efficiency") ? "bg-info" :
                    "bg-success"
                  }`}
                  role="progressbar"
                  style={{ width: `${metrics[key]}%` }}
                ></div>
              </div>
            </div>
          ))}
      </Card.Body>
    </Card>
  );
}

EstablishmentMetrics.propTypes = {
  metrics: PropTypes.object,
};
