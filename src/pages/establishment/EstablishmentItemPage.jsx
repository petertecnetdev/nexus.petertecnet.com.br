// src/pages/establishment/EstablishmentItemPage.jsx
import React from "react";
import { Container, Row, Col, Alert } from "react-bootstrap";
import { useParams, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";

import GlobalNav from "../../components/GlobalNav";
import EstablishmentHero from "../../components/establishment/EstablishmentHero";
import GlobalCard from "../../components/GlobalCard";
import GlobalButton from "../../components/GlobalButton";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsBySlug from "../../hooks/useEstablishmentItemsBySlug";
import api from "../../services/api";
import { appId } from "../../config";

const fmtBRL = (value) =>
  `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

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
    const result = await Swal.fire({
      title: "Excluir item?",
      text: `O item “${item.name}” será removido deste catálogo.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
    });

    if (!result.isConfirmed) return;

    try {
      await api.delete(`/item/${encodeURIComponent(item.id)}`, {
        params: { app_id: appId },
        data: { app_id: appId },
      });
      await Swal.fire("Item excluído", "O item foi removido do catálogo.", "success");
      reload();
    } catch (error) {
      await Swal.fire(
        "Erro ao excluir item",
        error?.response?.data?.error ||
          error?.response?.data?.message ||
          "Não foi possível excluir o item.",
        "error"
      );
    }
  };

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando itens…", "Preparando seu catálogo…"]}
      />
    );
  }

  return (
    <>
      <GlobalNav />

      {establishment && (
        <EstablishmentHero
          title={establishment.fantasy || establishment.name}
          subtitle="Itens do catálogo"
          description="Cadastre, revise e organize os itens que serão apresentados no catálogo público desta empresa."
          city={establishment.city}
          uf={establishment.uf}
          logo={establishment?.images?.logo || establishment.logo}
          background={
            establishment?.images?.background || establishment.background
          }
          showBack
        />
      )}

      <Container className="mt-4">
        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {!apiError && establishment && (
          <>
            <div className="d-flex justify-content-between align-items-center gap-3 mb-4 flex-wrap">
              <div className="text-light-50">
                {count} {count === 1 ? "item cadastrado" : "itens cadastrados"}
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <GlobalButton
                  variant="outline"
                  onClick={() => navigate(`/catalog/${establishment.slug}`)}
                >
                  Ver catálogo
                </GlobalButton>
                <GlobalButton
                  variant="success"
                  onClick={() =>
                    navigate(`/item/create/${establishment.slug}`, {
                      state: {
                        establishment: {
                          id: establishment.id,
                          app_id: establishment.app_id,
                          slug: establishment.slug,
                          name: establishment.name,
                          fantasy: establishment.fantasy,
                          description: establishment.description,
                          city: establishment.city,
                          uf: establishment.uf,
                          logo: establishment?.images?.logo || establishment.logo,
                          background:
                            establishment?.images?.background || establishment.background,
                        },
                      },
                    })
                  }
                >
                  + Novo item
                </GlobalButton>
              </div>
            </div>

            {count === 0 ? (
              <Alert variant="secondary">
                Este catálogo ainda não possui itens. Cadastre o primeiro item para começar a publicação.
              </Alert>
            ) : (
              <Row className="g-4">
                {items.map((item) => (
                  <Col key={item.id} xs={12} md={6} lg={4}>
                    <GlobalCard
                      item={item}
                      fmtBRL={fmtBRL}
                      navigate={navigate}
                      actions={
                        <div className="d-flex gap-2">
                          <GlobalButton
                            variant="outline"
                            size="sm"
                            full
                            onClick={() => navigate(`/item/view/${item.slug}`)}
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
            )}
          </>
        )}
      </Container>
    </>
  );
}
