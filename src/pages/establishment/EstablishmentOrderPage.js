// src/pages/establishment/EstablishmentOrderPage.jsx
import React from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalOrderCard from "../../components/GlobalOrderCard";
import GlobalButton from "../../components/GlobalButton";
import useEstablishmentOrdersBySlug from "../../hooks/useEstablishmentOrdersBySlug";

export default function EstablishmentOrderPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const { establishment, orders, loading, apiError } =
    useEstablishmentOrdersBySlug(slug);

  return (
    <>
      <GlobalNav />

      <Container className="mt-4">
        {loading && (
          <div className="text-center py-5">
            <Spinner animation="border" />
          </div>
        )}

        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {!loading && establishment && (
          <>
    <EstablishmentHero
  entity={establishment}
  title={`Pedidos da ${establishment?.fantasy || establishment?.name}`}
  subtitle="Histórico e gestão de pedidos"
  description="Acompanhe todos os pedidos do estabelecimento, visualize detalhes, status e tempos de execução dos serviços."
  showBack
/>



            <Row className="mb-4">
              <Col className="d-flex justify-content-end">
                <GlobalButton
  variant="primary"
  size="md"
  rounded
  onClick={() => navigate(`/order/create/${slug}`)}
>
  Novo Pedido
</GlobalButton>

              </Col>
            </Row>

            {orders.length === 0 && (
              <Alert variant="info">Nenhum pedido encontrado.</Alert>
            )}

            <Row className="g-4">
              {orders.map((order) => (
                <Col key={order.id} xs={12} md={6} lg={4}>
                  <GlobalOrderCard order={order} />
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </>
  );
}
