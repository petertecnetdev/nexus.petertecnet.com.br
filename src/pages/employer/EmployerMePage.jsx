// src/pages/employer/EmployerMePage.jsx
import React from "react";
import { Container, Alert, Row, Col, Card, Spinner } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import {
  FaClock,
  FaCalendarCheck,
  FaChartLine,
} from "react-icons/fa";
import GlobalNav from "../../components/GlobalNav";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerMe from "../../hooks/useEmployerMe";
import useImageUtils from "../../hooks/useImageUtils";
import "./EmployerMePage.css";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerMePage() {
  const navigate = useNavigate();
  const { employer, isLoading, apiError } = useEmployerMe();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <div className="d-flex justify-content-center py-5">
          <Spinner animation="border" />
        </div>
      </>
    );
  }

  if (apiError) {
    return (
      <>
        <GlobalNav />
        <Container className="mt-4">
          <Alert variant="danger">{apiError}</Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <EmployerHero
        title="Área do Colaborador"
        subtitle="Gerencie seus horários e acompanhe seus atendimentos"
        employer={employer}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container className="py-4">
        <Row className="g-4">
          <Col md={6} lg={4}>
            <Card
              className="ema-card"
              onClick={() => navigate("/employer/schedules")}
            >
              <Card.Body>
                <div className="ema-icon primary">
                  <FaClock />
                </div>
                <h5>Meus Horários</h5>
                <p>Configure sua disponibilidade semanal de atendimento</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card
              className="ema-card"
              onClick={() => navigate("/employer/orders")}
            >
              <Card.Body>
                <div className="ema-icon success">
                  <FaCalendarCheck />
                </div>
                <h5>Meus Atendimentos</h5>
                <p>Visualize e acompanhe todos os seus atendimentos</p>
              </Card.Body>
            </Card>
          </Col>

          <Col md={6} lg={4}>
            <Card
              className="ema-card"
              onClick={() => navigate("/employer/my-orders")}
            >
              <Card.Body>
                <div className="ema-icon warning">
                  <FaChartLine />
                </div>
                <h5>Meus Pedidos</h5>
                <p>Pedidos vinculados aos seus atendimentos</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
