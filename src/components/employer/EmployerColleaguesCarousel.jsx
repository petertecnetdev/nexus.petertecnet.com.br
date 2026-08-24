import React from "react";
import PropTypes from "prop-types";
import { Card, Badge, Button } from "react-bootstrap";
import { FaEye, FaShoppingBag, FaStar } from "react-icons/fa";
import useImageUtils from "../../hooks/useImageUtils";
import "./EmployerColleaguesCarousel.css";

export default function EmployerColleaguesCarousel({ colleagues = [], navigate }) {
  const { imageUrl, handleImgError } = useImageUtils("/images/avatar-placeholder.png");

  if (!colleagues || colleagues.length === 0) return null;

  return (
    <Card className="colleagues-card-container bg-dark text-light border-0 shadow-sm mt-4">
      <Card.Header className="d-flex justify-content-center align-items-center bg-black border-0 py-3">
        <h5 className="neon-title mb-0">💈 Colegas de Trabalho</h5>
      </Card.Header>

      <Card.Body className="pb-4">
        <div className="colleagues-grid">
          {colleagues.map((c) => (
            <Card key={c.id} className="colleague-card text-light bg-dark">
              <div
                className="colleague-avatar-wrap"
                onClick={() => navigate(`/employer/view/${c.user_name}`)}
              >
                {c.avatar ? (
                  <img
                    src={imageUrl(c.avatar)}
                    alt={c.name || "Colaborador"}
                    className="colleague-avatar"
                    loading="lazy"
                    onError={handleImgError}
                  />
                ) : (
                  <div className="colleague-avatar-placeholder">
                    {c.name?.charAt(0) || "?"}
                  </div>
                )}
              </div>

              <Card.Body className="text-center p-3">
                <h6 className="colleague-name mb-1">{c.name}</h6>
                <p className="colleague-email mb-2 text-muted small">{c.email}</p>

                <div className="metrics-row d-flex justify-content-center flex-wrap gap-2 mb-2">
                  <Badge bg="info" title="Visualizações">
                    <FaEye className="me-1" /> {c.metrics?.total_views ?? 0}
                  </Badge>
                  <Badge bg="secondary" title="Pedidos">
                    <FaShoppingBag className="me-1" /> {c.metrics?.total_orders ?? 0}
                  </Badge>
                  <Badge bg="warning" text="dark" title="Engajamento">
                    <FaStar className="me-1" /> {c.metrics?.engagement_score ?? 0}
                  </Badge>
                </div>

                <Button
                  variant="outline-info"
                  size="sm"
                  className="rounded-pill mt-2 btn-view-profile"
                  onClick={() => navigate(`/employer/view/${c.user_name}`)}
                >
                  Ver Perfil
                </Button>
              </Card.Body>
            </Card>
          ))}
        </div>
      </Card.Body>
    </Card>
  );
}

EmployerColleaguesCarousel.propTypes = {
  colleagues: PropTypes.array.isRequired,
  navigate: PropTypes.func.isRequired,
};
