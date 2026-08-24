import React from "react";
import { Card } from "react-bootstrap";
import PropTypes from "prop-types";
import "./EmployerMetrics.css";

export default function EmployerMetrics({ metrics }) {
  if (!metrics) return null;

  const isValid = (v) =>
    v !== null &&
    v !== undefined &&
    v !== "" &&
    v !== "null" &&
    !(typeof v === "number" && isNaN(v));

  return (
    <Card className="emp-card m-3">
      <Card.Header>📊 Métricas do Colaborador</Card.Header>
      <Card.Body className="text-white">

        {/* === 💈 Atendimentos === */}
        <h6 className="text-info mb-2">💈 Atendimentos</h6>
        {[
          ["total_orders", "Pedidos Totais"],
          ["completed_orders", "Pedidos Concluídos"],
          ["cancelled_orders", "Pedidos Cancelados"],
          ["pending_orders", "Pedidos Pendentes"],
          ["total_revenue", "Receita Total (R$)"],
          ["average_ticket", "Ticket Médio (R$)"],
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

        {/* === 👁️ Engajamento === */}
        <h6 className="text-warning mb-2">👁️ Engajamento</h6>
        {[
          ["total_views", "Total de Visualizações"],
          ["unique_users", "Usuários Únicos"],
          ["avg_views_per_day", "Média de Views por Dia"],
          ["days_active", "Dias Ativo"],
          ["return_rate", "Clientes Recorrentes (%)"],
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

EmployerMetrics.propTypes = {
  metrics: PropTypes.object,
};
