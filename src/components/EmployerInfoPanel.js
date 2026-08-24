// src/components/EmployerInfoPanel.jsx
import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import PropTypes from "prop-types";
import "./EmployerInfoPanel.css";

export default function EmployerInfoPanel({
  employer,
  metrics,
  interactionSummary,
  userInteractions,
  ordersSummary,
  otherEmployers,
  imageUrl,
  handleImgError,
  openSchedulePopup,
  navigate,
}) {
  if (!employer) return null;

  const fmtBRL = (v) => `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;
  const establishment = employer.establishment || {};

  return (
    <div className="empv-info-panel">
      {/* PERFIL */}
      <Card bg="dark" text="light" className="shadow-sm border-0 rounded-4 mb-4 overflow-hidden">
        <Card.Body className="text-center">
          <img
            src={employer?.user?.avatar || imageUrl}
            onError={handleImgError}
            alt={employer?.user?.first_name}
            className="rounded-circle border border-secondary mb-3"
            width={100}
            height={100}
          />
          <h5 className="fw-bold mb-1 text-neon">
            {employer?.user?.first_name} {employer?.user?.last_name}
          </h5>
          <p className="text-muted mb-2">{employer?.role || "Colaborador"}</p>

          {establishment?.name && (
            <div className="small text-muted mb-3">
              <i>Estabelecimento:</i> {establishment.name}
            </div>
          )}

          <Button
            variant="info"
            className="text-uppercase fw-bold px-4 py-2 rounded-pill"
            onClick={() => openSchedulePopup(employer)}
          >
            Agendar com {employer?.user?.first_name}
          </Button>
        </Card.Body>
      </Card>

      {/* MÉTRICAS */}
      {metrics && (
        <Card bg="dark" text="light" className="mb-4 shadow-sm border-0 rounded-4">
          <Card.Header className="bg-black border-0 text-center">
            <strong className="text-uppercase">Métricas</strong>
          </Card.Header>
          <Card.Body className="d-flex justify-content-between text-center">
            <div className="flex-fill">
              <h6 className="mb-0">{metrics?.total_orders || 0}</h6>
              <small className="text-muted">Pedidos</small>
            </div>
            <div className="flex-fill">
              <h6 className="mb-0">{metrics?.total_views || 0}</h6>
              <small className="text-muted">Visualizações</small>
            </div>
            <div className="flex-fill">
              <h6 className="mb-0">{metrics?.unique_users || 0}</h6>
              <small className="text-muted">Usuários Únicos</small>
            </div>
          </Card.Body>
        </Card>
      )}

      {/* RESUMO DE PEDIDOS */}
      {ordersSummary && (
        <Card bg="dark" text="light" className="mb-4 shadow-sm border-0 rounded-4">
          <Card.Header className="bg-black border-0 text-center">
            <strong className="text-uppercase">Resumo de Pedidos</strong>
          </Card.Header>
          <Card.Body>
            <ul className="list-unstyled small mb-0">
              <li><strong>Total:</strong> {ordersSummary.total_orders || 0}</li>
              <li><strong>Atendidos:</strong> {ordersSummary.attended_orders || 0}</li>
              <li><strong>Pendentes:</strong> {ordersSummary.pending_orders || 0}</li>
              <li><strong>Cancelados:</strong> {ordersSummary.cancelled_orders || 0}</li>
              <li><strong>Receita Total:</strong> {fmtBRL(ordersSummary.total_revenue)}</li>
              <li><strong>Ticket Médio:</strong> {fmtBRL(ordersSummary.average_ticket)}</li>
              <li><strong>Taxa de Conclusão:</strong> {ordersSummary.completion_rate || 0}%</li>
              <li><strong>Taxa de Retorno:</strong> {ordersSummary.return_rate || 0}%</li>
            </ul>
          </Card.Body>
        </Card>
      )}

      {/* INTERAÇÕES */}
      {interactionSummary && (
        <Card bg="dark" text="light" className="mb-4 shadow-sm border-0 rounded-4">
          <Card.Header className="bg-black border-0 text-center">
            <strong className="text-uppercase">Interações</strong>
          </Card.Header>
          <Card.Body>
            <p className="mb-1"><strong>Total de Visualizações:</strong> {interactionSummary.total_views}</p>
            <p className="mb-1"><strong>Usuários Únicos:</strong> {interactionSummary.unique_users}</p>

            {interactionSummary.most_active_user && (
              <div className="d-flex align-items-center mt-2">
                <img
                  src={interactionSummary.most_active_user.avatar || imageUrl}
                  alt={interactionSummary.most_active_user.name}
                  onError={handleImgError}
                  className="rounded-circle me-2 border border-secondary"
                  width={40}
                  height={40}
                />
                <div>
                  <small className="text-muted">Mais ativo</small>
                  <div>{interactionSummary.most_active_user.name}</div>
                </div>
              </div>
            )}

            {interactionSummary.last_view_user && (
              <div className="d-flex align-items-center mt-3">
                <img
                  src={interactionSummary.last_view_user.avatar || imageUrl}
                  alt={interactionSummary.last_view_user.name}
                  onError={handleImgError}
                  className="rounded-circle me-2 border border-secondary"
                  width={40}
                  height={40}
                />
                <div>
                  <small className="text-muted">Último visitante</small>
                  <div>{interactionSummary.last_view_user.name}</div>
                </div>
              </div>
            )}
          </Card.Body>
        </Card>
      )}

      {/* OUTROS COLABORADORES */}
      {otherEmployers && otherEmployers.length > 0 && (
        <Card bg="dark" text="light" className="shadow-sm border-0 rounded-4">
          <Card.Header className="bg-black border-0 text-center">
            <strong className="text-uppercase">Outros Colaboradores</strong>
          </Card.Header>
          <Card.Body className="p-2">
            <div className="d-flex flex-wrap justify-content-center gap-2">
              {otherEmployers.map((emp) => (
                <div
                  key={emp.id}
                  className="text-center small cursor-pointer empv-other"
                  onClick={() => navigate(`/employer/${emp.user.user_name}`)}
                >
                  <img
                    src={emp.user.avatar || imageUrl}
                    alt={emp.user.first_name}
                    onError={handleImgError}
                    className="rounded-circle border border-secondary mb-1"
                    width={50}
                    height={50}
                  />
                  <div>{emp.user.first_name}</div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      )}
    </div>
  );
}

EmployerInfoPanel.propTypes = {
  employer: PropTypes.object,
  metrics: PropTypes.object,
  interactionSummary: PropTypes.object,
  userInteractions: PropTypes.array,
  ordersSummary: PropTypes.object,
  otherEmployers: PropTypes.array,
  imageUrl: PropTypes.string,
  handleImgError: PropTypes.func,
  openSchedulePopup: PropTypes.func,
  navigate: PropTypes.func,
};
