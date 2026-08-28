// src/pages/establishment/EstablishmentHomePage.jsx
import React from "react";
import { Col, Row } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

import { apiBaseUrl, appId } from "../../config";
import useEstablishmentHome from "../../hooks/useEstablishmentHome";

import GlobalNav from "../../components/GlobalNav";
import GlobalFooter from "../../components/GlobalFooter";
import GlobalCard from "../../components/GlobalCard";
import NexusFeedback from "../../components/NexusFeedback";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";

export default function EstablishmentHome() {
  const { establishments, isLoading, error } = useEstablishmentHome(apiBaseUrl, appId);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando catálogos…", "Organizando empresas publicadas…"]}
      />
    );
  }

  return (
    <>
      <GlobalNav />

      <main className="hp-wrapper">
        <div className="mb-4">
          <h1>Catálogos</h1>
          <p className="text-muted mb-0">
            Encontre empresas e acesse seus produtos e serviços em um único catálogo.
          </p>
        </div>

        {error && (
          <NexusFeedback type="error" title="Não foi possível carregar os catálogos">
            {error}
          </NexusFeedback>
        )}

        {!error && establishments.length === 0 && (
          <NexusFeedback type="neutral" title="Nenhum catálogo publicado">
            Ainda não há catálogos disponíveis para exibir neste momento.
          </NexusFeedback>
        )}

        {!error && establishments.length > 0 && (
          <Row className="g-3">
            {establishments.map((establishment) => (
              <Col key={establishment.id} xs={12} sm={6} md={4} lg={3}>
                <GlobalCard
                  item={establishment}
                  navigate={navigate}
                  showSchedule={false}
                />
              </Col>
            ))}
          </Row>
        )}
      </main>

      <GlobalFooter />
    </>
  );
}
