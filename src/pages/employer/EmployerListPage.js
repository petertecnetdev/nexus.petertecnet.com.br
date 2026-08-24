// src/pages/employer/EmployerMePage.jsx
import React from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import GlobalNav from "../../components/GlobalNav";
import EmployerHero from "../../components/employer/EmployerHero";
import useEmployerMe from "../../hooks/useEmployerMe";
import useImageUtils from "../../hooks/useImageUtils";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerMePage() {
  const { employer, isLoading, apiError } = useEmployerMe();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  if (isLoading) {
    return (
      <>
        <GlobalNav />
        <Container className="text-center mt-5">
          <Spinner animation="border" />
        </Container>
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
        subtitle="Gerencie seus atendimentos, horários, clientes e vínculos"
        employer={employer}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container fluid className="employer-my-wrapper py-5">
        <Row className="justify-content-center">
          <Col xs={12} md={10} lg={8} className="text-center text-muted">
            Utilize os atalhos acima para acessar rapidamente suas áreas de
            trabalho.
          </Col>
        </Row>
      </Container>
    </>
  );
}
