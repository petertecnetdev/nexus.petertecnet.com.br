// src/pages/establishment/EstablishmentItemPage.jsx
import React, { useEffect, useMemo, useState } from "react";
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
import "./EstablishmentItemPage.css";

const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

export default function EstablishmentItemPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState({});
  const [metricsLoading, setMetricsLoading] = useState(false);

  const { establishment, items, count, loading, apiError, reload } = useEstablishmentItemsBySlug(slug);

  useEffect(() => {
    if (!establishment?.id) {
      setMetrics({});
      return undefined;
    }

    const controller = new AbortController();
    const loadMetrics = async () => {
      try {
        setMetricsLoading(true);
        const { data } = await api.get("/account/item-metrics", {
          params: { app_id: appId, establishment_id: establishment.id },
          signal: controller.signal,
        });
        const rows = Array.isArray(data?.items) ? data.items : [];
        setMetrics(Object.fromEntries(rows.map((row) => [String(row.id), Number(row.total_views || 0)])));
      } catch (error) {
        if (error?.code !== "ERR_CANCELED") setMetrics({});
      } finally {
        if (!controller.signal.aborted) setMetricsLoading(false);
      }
    };

    loadMetrics();
    return () => controller.abort();
  }, [establishment?.id]);

  const enrichedItems = useMemo(
    () => items.map((item) => ({ ...item, total_views: metrics[String(item.id)] ?? Number(item.total_views || 0) })),
    [items, metrics]
  );

  const insights = useMemo(() => {
    const totalViews = enrichedItems.reduce((sum, item) => sum + Number(item.total_views || 0), 0);
    const mostViewed = enrichedItems.reduce(
      (best, item) => !best || Number(item.total_views || 0) > Number(best.total_views || 0) ? item : best,
      null
    );
    return { totalViews, mostViewed };
  }, [enrichedItems]);

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
        error?.response?.data?.error || error?.response?.data?.message || "Não foi possível excluir o item.",
        "error"
      );
    }
  };

  if (loading) {
    return <ProcessingIndicatorComponent messages={["Carregando itens…", "Preparando seu catálogo…"]} />;
  }

  return (
    <>
      <GlobalNav />

      {establishment && (
        <EstablishmentHero
          title={establishment.fantasy || establishment.name}
          subtitle="Gestão do catálogo"
          description="Edite itens, acompanhe visualizações e mantenha o catálogo sempre atualizado."
          city={establishment.city}
          uf={establishment.uf}
          logo={establishment?.images?.logo || establishment.logo}
          background={establishment?.images?.background || establishment.background}
          showBack
        />
      )}

      <Container className="item-manager mt-4">
        {apiError && <Alert variant="danger">{apiError}</Alert>}

        {!apiError && establishment && (
          <>
            <div className="item-manager__topbar">
              <div>
                <span className="item-manager__eyebrow">Conteúdo do catálogo</span>
                <h2>Itens de {establishment.fantasy || establishment.name}</h2>
              </div>

              <div className="d-flex gap-2 flex-wrap">
                <GlobalButton variant="outline" onClick={() => navigate(`/catalog/health/${establishment.slug}`)}>
                  Saúde do catálogo
                </GlobalButton>
                <GlobalButton variant="outline" onClick={() => navigate(`/catalog/import/${establishment.slug}`)}>
                  Importar catálogo
                </GlobalButton>
                <GlobalButton variant="outline" onClick={() => navigate(`/catalog/${establishment.slug}`)}>
                  Ver catálogo
                </GlobalButton>
                <GlobalButton
                  variant="success"
                  onClick={() => navigate(`/item/create/${establishment.slug}`, {
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
                        background: establishment?.images?.background || establishment.background,
                      },
                    },
                  })}
                >
                  + Novo item
                </GlobalButton>
              </div>
            </div>

            <section className="item-manager__insights" aria-label="Resumo de desempenho do catálogo">
              <div className="item-insight"><span>Itens cadastrados</span><strong>{count}</strong></div>
              <div className="item-insight">
                <span>Visualizações dos itens</span>
                <strong>{metricsLoading ? "…" : insights.totalViews.toLocaleString("pt-BR")}</strong>
              </div>
              <div className="item-insight item-insight--wide">
                <span>Item mais visualizado</span>
                <strong>{metricsLoading ? "Carregando…" : insights.mostViewed?.name || "Sem visualizações ainda"}</strong>
                {!metricsLoading && insights.mostViewed && (
                  <small>{Number(insights.mostViewed.total_views || 0).toLocaleString("pt-BR")} visualizações</small>
                )}
              </div>
            </section>

            {count === 0 ? (
              <div className="item-manager__empty">
                <i className="fas fa-box-open" aria-hidden="true" />
                <h3>Seu catálogo está vazio</h3>
                <p>Cadastre o primeiro item ou importe uma planilha para começar a aparecer no catálogo público.</p>
                <div className="d-flex gap-2 justify-content-center flex-wrap">
                  <GlobalButton variant="success" onClick={() => navigate(`/item/create/${establishment.slug}`)}>
                    Criar primeiro item
                  </GlobalButton>
                  <GlobalButton variant="outline" onClick={() => navigate(`/catalog/import/${establishment.slug}`)}>
                    Importar catálogo
                  </GlobalButton>
                </div>
              </div>
            ) : (
              <Row className="g-3 item-manager__grid">
                {enrichedItems.map((item) => (
                  <Col key={item.id} xs={12} sm={6} lg={4} xl={3}>
                    <GlobalCard
                      item={item}
                      fmtBRL={fmtBRL}
                      navigate={navigate}
                      actions={
                        <div className="item-manager__actions">
                          <GlobalButton variant="outline" size="sm" onClick={() => navigate(`/item/view/${item.slug}`)}>Ver</GlobalButton>
                          <GlobalButton variant="warning" size="sm" onClick={() => navigate(`/item/update/${item.id}`)}>Editar</GlobalButton>
                          <GlobalButton variant="danger" size="sm" onClick={() => handleDelete(item)}>Excluir</GlobalButton>
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
