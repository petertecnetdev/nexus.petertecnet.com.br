import React, { useMemo, useCallback, useState } from "react";
import { Card, Button, Badge, Modal } from "react-bootstrap";
import PropTypes from "prop-types";
import LoginFormComponent from "../auth/LoginFormComponent";
import "./EmployerSidebar.css";

const fmtBRL = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function EmployerSidebar({
  employer,
  metrics,
  ordersSummary,
  userInteractions,
  otherEmployers,
  imageUrl,
  handleImgError,
  navigate,
  openSchedulePopup,
}) {
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingEmployer, setPendingEmployer] = useState(null);

  const isAuthenticated = () => !!localStorage.getItem("token");

  const handleScheduleClick = (emp) => {
    if (!isAuthenticated()) {
      setPendingEmployer(emp);
      setShowLoginModal(true);
      return;
    }
    openSchedulePopup(emp);
  };

  const handleLoginSuccess = () => {
    setShowLoginModal(false);
    if (pendingEmployer) {
      setTimeout(() => {
        openSchedulePopup(pendingEmployer);
        setPendingEmployer(null);
      }, 300);
    }
  };

  const isValid = useCallback(
    (v) =>
      v !== null &&
      v !== undefined &&
      v !== "" &&
      v !== "null" &&
      !(typeof v === "number" && isNaN(v)),
    []
  );

  const establishment = employer?.establishment || {};
  const colleagues = useMemo(
    () =>
      establishment?.employers?.filter(
        (emp) => emp?.user && emp?.id !== employer?.id
      ) || [],
    [establishment, employer]
  );

  if (!employer) return <div className="sidebar-loading-skeleton"></div>;

  const u = employer.user || {};
  const fullName = `${u.first_name || ""} ${u.last_name || ""}`.trim();

  return (
    <>
      <div className="emp-sidebar">
        <Card className="emp-card">
          <Card.Header className="d-flex align-items-center justify-content-between">
            <span>💈 Colaborador</span>
          </Card.Header>

          <Card.Body>
            <div className="d-flex align-items-center mb-3">
              <div className="position-relative me-3">
                <div className="emp-avatar-frame">
                  {isValid(u.avatar) ? (
                    <img
                      src={imageUrl(u.avatar)}
                      onError={handleImgError}
                      className="emp-avatar-img"
                      alt={fullName}
                    />
                  ) : (
                    <div className="emp-avatar-placeholder">
                      {u.first_name?.charAt(0) || "?"}
                    </div>
                  )}
                </div>
                <div
                  className={`emp-status-dot ${
                    employer.is_available ? "online" : "offline"
                  }`}
                ></div>
              </div>

              <div>
                <div className="fw-semibold text-light fs-5">{fullName}</div>
                {isValid(employer.role) && (
                  <div className="text-info small mb-1">{employer.role}</div>
                )}
                <div className="text-secondary small">
                  👁️ {(metrics?.total_views ?? employer.total_views ?? 0)} visualizações • 👤{" "}
                  {(metrics?.unique_users ?? employer.unique_users ?? 0)} usuários únicos
                </div>
                {employer.total_appointments > 0 && (
                  <div className="text-success small">
                    💇 {employer.total_appointments} atendimentos realizados
                  </div>
                )}
                {u.about && (
                  <div className="text-secondary small mt-1 text-truncate">
                    {u.about}
                  </div>
                )}
              </div>
            </div>

            {establishment?.name && (
              <div
                className="emp-establishment-highlight mb-3 p-2 rounded-3 text-center cursor-pointer"
                onClick={() =>
                  establishment.slug
                    ? navigate(`/establishment/view/${establishment.slug}`)
                    : null
                }
              >
                <div className="d-flex flex-column align-items-center">
                  <img
                    src={imageUrl(establishment.logo)}
                    onError={handleImgError}
                    alt={establishment.name}
                    className="emp-establishment-logo mb-2"
                  />
                  <div className="emp-establishment-name text-light fw-semibold">
                    {establishment.name}
                  </div>
                  <div className="emp-establishment-location text-secondary small">
                    {establishment.city} - {establishment.state}
                  </div>
                </div>
              </div>
            )}

            <Button
              variant="outline-warning"
              className="w-100 emp-schedule-btn"
              onClick={() => handleScheduleClick(employer)}
            >
              Agendar com {u.first_name || "o colaborador"}
            </Button>

            {metrics && (
              <div className="mt-4">
                <div className="text-light small">
                  <strong>Métricas</strong>
                </div>
                <div className="text-secondary small">
                  Total de Visualizações: {metrics.total_views || 0}
                </div>
                <div className="text-secondary small">
                  Usuários Únicos: {metrics.unique_users || 0}
                </div>
              </div>
            )}

            {ordersSummary && (
              <div className="mt-3">
                <div className="text-light small">
                  <strong>Atendimentos</strong>
                </div>
                <div className="text-secondary small">
                  Confirmados: {ordersSummary.confirmed || 0}
                </div>
                <div className="text-secondary small">
                  Concluídos: {ordersSummary.completed || 0}
                </div>
                <div className="text-secondary small">
                  Cancelados: {ordersSummary.cancelled || 0}
                </div>
              </div>
            )}

            {userInteractions?.length > 0 && (
              <div className="mt-4">
                <div className="text-light small mb-2">
                  <strong>Últimas Interações</strong>
                </div>
                {userInteractions.slice(0, 5).map((ui) => (
                  <div
                    key={ui.user_id}
                    className="text-secondary small mb-1 cursor-pointer"
                    onClick={() =>
                      ui.user_name ? navigate(`/user/view/${ui.user_name}`) : null
                    }
                  >
                    👤 {ui.name} • {ui.last_interaction}
                  </div>
                ))}
              </div>
            )}
          </Card.Body>
        </Card>

        {colleagues.length > 0 && (
          <Card className="emp-card mt-3">
            <Card.Header className="d-flex align-items-center justify-content-between">
              <span>💈 Outros Colaboradores</span>
              <Badge bg="info" className="px-2 py-1">
                {colleagues.length}
              </Badge>
            </Card.Header>
            <Card.Body>
              {colleagues.map((col) => {
                const cu = col.user || {};
                const name = `${cu.first_name || ""} ${cu.last_name || ""}`.trim();
                return (
                  <div key={col.id} className="est-employee-card mb-3">
                    <div className="d-flex align-items-center justify-content-between">
                      <div
                        className="d-flex align-items-center flex-grow-1 cursor-pointer"
                        onClick={() =>
                          cu.user_name ? navigate(`/employer/view/${cu.user_name}`) : null
                        }
                      >
                        <div className="position-relative me-3">
                          <div className="est-avatar-frame">
                            {isValid(cu.avatar) ? (
                              <img
                                src={imageUrl(cu.avatar)}
                                onError={handleImgError}
                                className="est-avatar-img"
                                alt={name}
                              />
                            ) : (
                              <div className="est-avatar-placeholder">
                                {cu.first_name?.charAt(0) || "?"}
                              </div>
                            )}
                          </div>
                          <div
                            className={`est-status-dot ${
                              col.is_available ? "online" : "offline"
                            }`}
                          ></div>
                        </div>

                        <div>
                          <div className="fw-semibold text-light fs-6">{name}</div>
                          {isValid(col.role) && (
                            <div className="text-info small">{col.role}</div>
                          )}
                          <div className="text-secondary small mt-1">
                            👁️ {col.total_views || 0} visualizações • 👤{" "}
                            {col.unique_users || 0} usuários únicos
                          </div>
                          {col.total_appointments > 0 && (
                            <div className="text-success small">
                              💇 {col.total_appointments} atendimentos
                            </div>
                          )}
                        </div>
                      </div>

                      <Button
                        size="sm"
                        variant="outline-warning"
                        title="Agendar horário"
                        className="est-employee-btn"
                        onClick={() => handleScheduleClick(col)}
                      >
                        Agendar
                      </Button>
                    </div>
                  </div>
                );
              })}
            </Card.Body>
          </Card>
        )}
      </div>

      <Modal
        show={showLoginModal}
        onHide={() => setShowLoginModal(false)}
        centered
        size="md"
        backdrop="static"
        className="login-modal"
      >
        <Modal.Body className="bg-dark text-light p-4 rounded-3">
          <h5 className="text-center mb-3">Faça login para continuar</h5>
          <LoginFormComponent onSuccess={handleLoginSuccess} />
        </Modal.Body>
      </Modal>
    </>
  );
}

EmployerSidebar.propTypes = {
  employer: PropTypes.object,
  metrics: PropTypes.object,
  ordersSummary: PropTypes.object,
  userInteractions: PropTypes.array,
  otherEmployers: PropTypes.array,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  navigate: PropTypes.func.isRequired,
  openSchedulePopup: PropTypes.func.isRequired,
};
