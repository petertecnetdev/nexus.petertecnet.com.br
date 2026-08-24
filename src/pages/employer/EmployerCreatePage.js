// src/pages/employer/EmployerCreatePage.jsx
import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";

import GlobalNav from "../../components/GlobalNav";
import GlobalHeroList from "../../components/GlobalHeroList";
import EmployerCreateForm from "../../components/employer/EmployerCreateForm";
import useImageUtils from "../../hooks/useImageUtils";
import useEmployerCreate from "../../hooks/useEmployerCreate";

const PLACEHOLDER = "/images/logo.png";

export default function EmployerCreatePage() {
  const { slug } = useParams();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  const {
    establishment,
    users,
    role,
    loading,
    searching,
    errors,
    setRole,
    searchUsers,
    createEmployer,
    detachEmployer,
  } = useEmployerCreate(slug);

  const heroData = useMemo(() => {
    const subtitle =
      establishment?.city && establishment?.uf
        ? `${establishment.city} - ${establishment.uf}`
        : "";

    return {
      logo: establishment?.logo || PLACEHOLDER,
      background: null,
      title: "Associar colaborador",
      description: "Buscar usuário e gerenciar associação ao estabelecimento",
      subtitle,
      metrics: [],
    };
  }, [establishment]);

  if (!establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5 text-center">
          <Spinner animation="border" />
        </Container>
      </>
    );
  }

  return (
    <>
      <GlobalNav />

      <GlobalHeroList
        logo={heroData.logo}
        background={heroData.background}
        title={heroData.title}
        subtitle={heroData.subtitle}
        description={heroData.description}
        metrics={heroData.metrics}
        imageUrl={imageUrl}
        handleImgError={handleImgError}
      />

      <Container className="py-4">
        <Row className="justify-content-center">
          <Col md={10}>
            <EmployerCreateForm
              users={users}
              role={role}
              loading={loading}
              searching={searching}
              errors={errors}
              imageUrl={imageUrl}
              handleImgError={handleImgError}
              onSearch={searchUsers}
              setRole={setRole}
              establishmentId={establishment.id}
              onAssociate={async (user) => {
                await createEmployer(user);
              }}
              onDetach={async (employerId) => {
                await detachEmployer(employerId);
              }}
            />
          </Col>
        </Row>
      </Container>
    </>
  );
}
