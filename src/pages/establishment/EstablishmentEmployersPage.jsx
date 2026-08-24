  // src/pages/establishment/EstablishmentEmployersPage.jsx
  import React from "react";
  import {
    Container,
    Row,
    Col,
    Spinner,
    Card,
    Badge,
  } from "react-bootstrap";
  import { useParams, useNavigate } from "react-router-dom";
  import Swal from "sweetalert2";

  import GlobalNav from "../../components/GlobalNav";
  import EstablishmentHero from "../../components/establishment/EstablishmentHero";
  import GlobalCard from "../../components/GlobalCard";
  import GlobalButton from "../../components/GlobalButton";
  import useEstablishmentEmployersBySlug from "../../hooks/useEstablishmentEmployersBySlug";
  import api from "../../services/api";

  export default function EstablishmentEmployersPage() {
    const { slug } = useParams();
    const navigate = useNavigate();

    const { establishment, employers, count, loading, apiError } =
      useEstablishmentEmployersBySlug(slug);

    const handleDetach = async (employer) => {
      const res = await Swal.fire({
        title: "Remover colaborador?",
        text: `Deseja remover ${
          employer.user?.first_name || "este colaborador"
        } do estabelecimento?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sim, remover",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
        background: "#0b1220",
        color: "#e5e7eb",
      });

      if (!res.isConfirmed) return;

      try {
        await api.post("/employer/detach", {
          employer_id: employer.id,
          establishment_id: establishment.id,
        });

        await Swal.fire({
          icon: "success",
          title: "Removido",
          text: "Colaborador removido com sucesso.",
          timer: 1500,
          showConfirmButton: false,
          background: "#0b1220",
          color: "#e5e7eb",
        });

        window.location.reload();
      } catch (err) {
        await Swal.fire({
          icon: "error",
          title: "Erro",
          text:
            err?.response?.data?.error ||
            err?.response?.data?.message ||
            "Erro ao remover colaborador.",
          background: "#0b1220",
          color: "#e5e7eb",
        });
      }
    };

    if (loading) {
      return (
        <>
          <GlobalNav />
          <Container className="py-5 text-center">
            <Spinner animation="border" />
          </Container>
        </>
      );
    }

    if (!establishment) {
      return (
        <>
          <GlobalNav />
       
        </>
      );
    }

    return (
      <>
        <GlobalNav />

        <Container className="py-4">
          <EstablishmentHero
            title={`Equipe da ${establishment.name}`}
            subtitle="Colaboradores vinculados ao estabelecimento"
            description="Gerencie os profissionais do time, controle acessos, permissões e acompanhe métricas individuais."
            city={establishment.city}
            uf={establishment.uf}
            logo={establishment?.images?.logo}
            background={establishment?.images?.background}
          />


          <Card
            className="mb-4"
            style={{
              background: "#0b1220",
              border: "1px solid rgba(148,163,184,.12)",
              borderRadius: 14,
            }}
          >
            <Card.Header
              className="d-flex justify-content-between align-items-center"
              style={{ background: "transparent", color: "#e5e7eb" }}
            >
              <div className="d-flex align-items-center gap-2">
                <span>Equipe</span>
                <Badge bg="secondary">{count}</Badge>
              </div>

              <GlobalButton
                size="sm"
                variant="primary"
                onClick={() =>
                  navigate(`/employer/create/${establishment.slug}`)
                }
              >
                <i className="bi bi-plus-lg me-2" />
                Adicionar colaborador
              </GlobalButton>
            </Card.Header>

            <Card.Body>
              

              <Row className="g-3">
                {employers.map((emp) => {
                  const fullName = `${emp.user?.first_name || ""} ${
                    emp.user?.last_name || ""
                  }`.trim();

                  const avatar =
                    emp.images?.avatar || emp.user?.avatar || null;

                  const metrics = emp.metrics || {};

                  return (
                    <Col key={emp.id} xl={3} lg={4} md={6} xs={12}>
                      <GlobalCard
                        item={{
                          type: "employer",
                          id: emp.id,
                          name: fullName || emp.user?.email,
                          slug: emp.id,
                          avatar,
                          images: { avatar },
                          total_views: metrics.total_views ?? 0,
                        }}
                        navigate={(path) => navigate(path)}
                        actions={
                          <div className="d-flex flex-column gap-2">
                            <div className="d-flex flex-wrap gap-1">
                              <Badge bg="secondary">
                                Pedidos: {metrics.total_orders ?? 0}
                              </Badge>
                              <Badge bg="success">
                                Concluídos: {metrics.completed_orders ?? 0}
                              </Badge>
                              <Badge bg="warning">
                                Pendentes: {metrics.pending_orders ?? 0}
                              </Badge>
                              <Badge bg="danger">
                                Cancelados: {metrics.cancelled_orders ?? 0}
                              </Badge>
                            </div>

                            <div className="d-flex flex-wrap gap-1">
                              <Badge bg="info">
                                Eficiência: {metrics.efficiency_rate ?? 0}%
                              </Badge>
                              <Badge bg="dark">
                                Engajamento: {metrics.engagement_score ?? 0}
                              </Badge>
                            </div>

                            <GlobalButton
                              size="sm"
                              variant="danger"
                              full
                              onClick={() => handleDetach(emp)}
                            >
                              Remover vínculo
                            </GlobalButton>
                          </div>
                        }
                      />
                    </Col>
                  );
                })}
              </Row>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }
