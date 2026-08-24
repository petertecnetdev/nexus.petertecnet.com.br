// src/pages/establishment/EstablishmentMyPage.jsx
import React from "react";
import { Container, Row, Col, Spinner, Alert, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import EstablishmentDashboard from "../../components/establishment/EstablishmentDashboard";
import useEstablishmentMy from "../../hooks/useEstablishmentMy";
import { appId } from "../../config";

export default function EstablishmentMyPage() {
  const navigate = useNavigate();
  const { establishments, isLoading, apiError } = useEstablishmentMy(appId);
  const heroEstablishment = establishments?.[0] || null;

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

      {heroEstablishment && (
        <EstablishmentHero
          title={heroEstablishment.fantasy || heroEstablishment.name}
          subtitle="Gestão central dos seus negócios"
          description="Acompanhe métricas, acesse rapidamente cada estabelecimento e gerencie serviços, itens, colaboradores e pedidos em um só lugar."
          city={heroEstablishment.city}
          uf={heroEstablishment.uf}
          logo={heroEstablishment?.images?.logo}
          background={heroEstablishment?.images?.background}
          showBack
        />
      )}

      <Container fluid className="establishment-my-wrapper mt-4">
        {/* ✅ Botão de criar novo estabelecimento */}
        <Row className="mb-3">
          <Col xs={12} className="d-flex justify-content-end">
            <Button
              variant="primary"
              onClick={() => navigate("/establishment/create")}
            >
              + Novo Estabelecimento
            </Button>
          </Col>
        </Row>

        {establishments.length === 0 && (
          <Row>
            <Col xs={12} className="text-center text-muted">
              Nenhum estabelecimento encontrado.
            </Col>
          </Row>
        )}

        {establishments.map((est) => (
          <EstablishmentDashboard
            key={est.id}
            establishment={est}
            navigate={navigate}
          />
        ))}
      </Container>
    </>
  );
}
