// src/pages/item/ItemListPage.jsx
import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Container, Row, Col, Spinner, Alert, ButtonGroup } from "react-bootstrap";
import axios from "axios";
import Swal from "sweetalert2";

import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import GlobalButton from "../../components/GlobalButton";
import GlobalHeroList from "../../components/GlobalHeroList";
import useItemListBySlug from "../../hooks/useItemListBySlug";
import useImageUtils from "../../hooks/useImageUtils";
import { apiBaseUrl } from "../../config";

const PLACEHOLDER = "/images/logo.png";

export default function ItemListPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { imageUrl, handleImgError } = useImageUtils(PLACEHOLDER);

  const { establishment, items, loading, apiError } = useItemListBySlug(slug);
  const [localItems, setLocalItems] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setLocalItems(items || []);
  }, [items]);

  const fmtBRL = (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });

  const mappedItems = useMemo(() => {
    if (!localItems?.length) return [];

    return localItems
      .map((item) => {
        const type =
          item.type ||
          (item.category === "product" ? "product" : "service");

        return {
          ...item,
          type,
          image: item.image || null,
          duration: item.duration ?? null,
          city: establishment?.city || null,
          uf: establishment?.uf || null,
          total_views: item.total_views ?? 0,
          establishment: establishment
            ? { name: establishment.name, slug: establishment.slug }
            : null,
        };
      })
      .filter((item) => {
        if (filter === "all") return true;
        return item.type === filter;
      });
  }, [localItems, establishment, filter]);

 const heroData = useMemo(() => {
  const servicesCount = (localItems || []).filter(
    (i) => i.type === "service" || i.category === "service"
  ).length;

  const productsCount = (localItems || []).filter(
    (i) => i.type === "product" || i.category === "product"
  ).length;

  const subtitle =
    establishment?.city && establishment?.uf
      ? `${establishment.fantasy || establishment.name} · ${establishment.city} - ${establishment.uf}`
      : establishment?.fantasy || establishment?.name || "";

  return {
    logo: establishment?.logo || PLACEHOLDER,
    background: null,

    title: "Itens",
    description: "Lista de serviços e produtos do estabelecimento",

    subtitle,

    metrics: [
      { label: "Serviços", value: servicesCount },
      { label: "Produtos", value: productsCount },
      { label: "Total", value: servicesCount + productsCount },
    ],
  };
}, [establishment, localItems]);


  const handleDelete = async (itemId) => {
    const token = localStorage.getItem("token");

    const confirm = await Swal.fire({
      title: "Excluir item",
      text: "Tem certeza que deseja excluir este item? Essa ação não pode ser desfeita.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sim, excluir",
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    });

    if (!confirm.isConfirmed) return;

    try {
      const { data } = await axios.delete(`${apiBaseUrl}/item/${itemId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (data?.message) {
        await Swal.fire({
          icon: "success",
          title: "Sucesso",
          text: data.message,
        });
      }

      setLocalItems((prev) => prev.filter((it) => it.id !== itemId));
    } catch (error) {
      const apiMsg =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        "Erro ao excluir o item.";
      await Swal.fire({ icon: "error", title: "Erro", text: apiMsg });
    }
  };

  const handleCreate = () => {
    if (establishment) navigate(`/item/create/${establishment.id}`);
  };

  const handleEdit = (id) => {
    navigate(`/item/update/${id}`);
  };

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


      <Container className="py-3">
        <Row className="mb-3 align-items-center">
          <Col>
            <h5 className="text-light mb-2">
              {mappedItems.length} item
              {mappedItems.length === 1 ? "" : "s"} listado
            </h5>

            <ButtonGroup>
              <GlobalButton
                size="sm"
                variant={filter === "all" ? "primary" : "outline"}
                onClick={() => setFilter("all")}
              >
                Todos
              </GlobalButton>

              <GlobalButton
                size="sm"
                variant={filter === "service" ? "primary" : "outline"}
                onClick={() => setFilter("service")}
              >
                Serviços
              </GlobalButton>

              <GlobalButton
                size="sm"
                variant={filter === "product" ? "primary" : "outline"}
                onClick={() => setFilter("product")}
              >
                Produtos
              </GlobalButton>
            </ButtonGroup>
          </Col>

          <Col className="text-end">
            {establishment && (
              <GlobalButton size="sm" variant="success" onClick={handleCreate}>
                + Novo Item
              </GlobalButton>
            )}
          </Col>
        </Row>

        {loading && (
          <div className="d-flex justify-content-center py-5">
            <Spinner animation="border" role="status" />
          </div>
        )}

        {!loading && apiError && (
          <Alert variant="danger" className="mt-3">
            {apiError}
          </Alert>
        )}

        {!loading && !apiError && (
          <>
            {mappedItems.length === 0 && (
              <Alert variant="secondary" className="text-center">
                Nenhum item encontrado para este filtro.
              </Alert>
            )}

            {mappedItems.length > 0 && (
              <Row className="gy-3">
                {mappedItems.map((item) => (
                  <Col xs={12} md={6} lg={4} key={item.id}>
                    <div className="h-100 d-flex flex-column">
                      <GlobalCard
                        item={item}
                        fmtBRL={fmtBRL}
                        navigate={navigate}
                        showSchedule={false}
                        openSchedulePopup={null}
                      />

                      <div className="d-flex justify-content-between mt-3 gap-2">
                        <GlobalButton
                          variant="outline"
                          size="sm"
                          full
                          onClick={() => handleEdit(item.id)}
                        >
                          Editar
                        </GlobalButton>

                        <GlobalButton
                          variant="danger"
                          size="sm"
                          full
                          onClick={() => handleDelete(item.id)}
                        >
                          Excluir
                        </GlobalButton>
                      </div>
                    </div>
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
