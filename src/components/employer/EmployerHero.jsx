// src/components/employer/EmployerHero.jsx
import React from "react";
import { Row, Col, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import "./EmployerHero.css";

export default function EmployerHero({
  title,
  subtitle,
  icon,
  badge,
  backLabel,
}) {
  const navigate = useNavigate();

  return (
    <Row className="eh-root mb-5">
      <Col>
        <div className="eh-card">
          <div className="eh-top">
            <Button
              variant="link"
              className="eh-back-btn"
              onClick={() => navigate(-1)}
            >
              <i className="bi bi-arrow-left me-2" />
              {backLabel}
            </Button>
          </div>

          <div className="eh-content">
            <div className="eh-left">
              <div className="eh-icon">
                <i className={`bi ${icon}`} />
              </div>

              <div className="eh-text">
                <h1>{title}</h1>
                {subtitle && <p>{subtitle}</p>}
              </div>
            </div>

            {badge && <div className="eh-badge">{badge}</div>}
          </div>
        </div>
      </Col>
    </Row>
  );
}

EmployerHero.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string,
  badge: PropTypes.string,
  backLabel: PropTypes.string,
};

EmployerHero.defaultProps = {
  icon: "bi-person-badge-fill",
  badge: "Painel do Profissional",
  backLabel: "Voltar",
};
