import React from "react";
import { Row, Col } from "react-bootstrap";
import "./EmployerSchedulesHero.css";

export default function EmployerSchedulesHero() {
  return (
    <Row className="esh-root mb-5">
      <Col>
        <div className="esh-card">
          <div className="esh-content">
            <div className="esh-left">
              <div className="esh-icon">
                <i className="bi bi-clock-fill" />
              </div>

              <div className="esh-text">
                <h1>Horários de Atendimento</h1>
                <p>
                  Defina claramente sua disponibilidade semanal. Esses horários
                  determinam quando os clientes poderão agendar atendimentos.
                </p>
              </div>
            </div>

            <div className="esh-badge">
              Painel do Profissional
            </div>
          </div>
        </div>
      </Col>
    </Row>
  );
}
