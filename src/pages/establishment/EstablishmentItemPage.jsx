// src/pages/establishment/EstablishmentItemPage.jsx
import React from "react";
import { Container, Row, Col, Spinner, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalCard from "../../components/GlobalCard";
import GlobalButton from "../../components/GlobalButton";
import useEstablishmentItemsBySlug from "../../hooks/useEstablishmentItemsBySlug";
import api from "../../services/api";

const fmtBRL = (v) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

export default function EstablishmentItemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();

  const {
    establishment,
    items,
    count,
    loading,
    apiError,
    reload,
  } = useEstablishmentItemsBySlug(slug);

  const handleDelete = async (item) => {
    const res = await Swal.fire({
      title: "Excluir item?",
      text: `Deseja excluir o item "${item.name}"?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!res.isConfirmed) return;

    try {
      await api.delete(`/item/${item.id}`);
      Swal.fire("Excluído", "Item removido com sucesso.", "success");
      reload();
    } catch (err) {
      Swal.fire(
        "Erro",
        err?.response?.data?.error || "Erro ao excluir item.",
        "error"
      );
    }
  };

  return (
    <>
      <GlobalNav />

      {!loading && establishment && (
        <EstablishmentHero
          title={establishment.fantasy || establishment.name}
          subtitle="Produtos e serviços cadastrados"
          description="Gerencie os produtos e serviços do estabelecimento. Serviços utilizam o tempo de duração para calcular automaticamente o tempo das ordens de serviço."
          city={establishment.city}
          uf={establishment.uf}
          logo={establishment?.images?.logo || establishment.logo}
          background={establishment?.images?.background || establishment.background}
          showBack
        />
      )}

      <Container className="mt-4">
        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" />
          </div>
        )}

        {!loading && apiError && (
          <Alert variant="danger">{apiError}</Alert>
        )}

        {!loading && establishment && (
          <>
            <div className="d-flex justify-content-end mb-4">
              <GlobalButton
                variant="success"
                onClick={() =>
                  navigate(`/item/create/${establishment.slug}`, {
                    state: {
                      establishment: {
                        id: establishment.id,
                        slug: establishment.slug,
                        name: establishment.name,
                        fantasy: establishment.fantasy,
                        description: establishment.description,
                        city: establishment.city,
                        uf: establishment.uf,
                        logo:
                          establishment?.images?.logo || establishment.logo,
                        background:
                          establishment?.images?.background ||
                          establishment.background,
                      },
                    },
                  })
                }
              >
                + Novo item
              </GlobalButton>
            </div>

            {count === 0 && (
              <Alert variant="secondary">
                Nenhum item cadastrado para este estabelecimento.
              </Alert>
            )}

            <Row className="g-4">
              {items.map((item) => (
                <Col key={item.id} xs={12} md={6} lg={4}>
                  <GlobalCard
                    item={item}
                    fmtBRL={fmtBRL}
                    navigate={(path) => navigate(path)}
                    actions={
                      <div className="d-flex gap-2">
                        <GlobalButton
                          variant="outline"
                          size="sm"
                          full
                          onClick={() => navigate(`/item/${item.slug}`)}
                        >
                          Ver
                        </GlobalButton>

                        <GlobalButton
                          variant="warning"
                          size="sm"
                          full
                          onClick={() => navigate(`/item/update/${item.id}`)}
                        >
                          Editar
                        </GlobalButton>

                        <GlobalButton
                          variant="danger"
                          size="sm"
                          full
                          onClick={() => handleDelete(item)}
                        >
                          Excluir
                        </GlobalButton>
                      </div>
                    }
                  />
                </Col>
              ))}
            </Row>
          </>
        )}
      </Container>
    </>
  );
}
