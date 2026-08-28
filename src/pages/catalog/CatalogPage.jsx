// src/pages/catalog/CatalogPage.jsx
import React, { useMemo, useState } from "react";
import { Alert, Badge, Col, Container, Form, Row, Spinner } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { FaLink, FaWhatsapp } from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import useEstablishmentItemsByIdentifier from "../../hooks/useEstablishmentItemsByIdentifier";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { linkApp } from "../../config";
import "./CatalogPage.css";

const fmtBRL = (value) =>
  `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

export default function CatalogPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, items, loading, apiError } =
    useEstablishmentItemsByIdentifier(slug);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const whatsappLink = useWhatsappLink(establishment);

  const activeItems = useMemo(
    () => items.filter((item) => Number(item.status ?? 1) !== 0),
    [items]
  );

  const categories = useMemo(() => {
    const values = activeItems
      .map((item) => item.category)
      .filter(Boolean)
      .map((value) => String(value).trim())
      .filter(Boolean);
    return [...new Set(values)].sort((a, b) => a.localeCompare(b));
  }, [activeItems]);

  const filteredItems = useMemo(() => {
    const needle = normalizeText(query);
    return activeItems.filter((item) => {
      const matchesCategory =
        category === "all" || normalizeText(item.category) === normalizeText(category);
      if (!matchesCategory) return false;
      if (!needle) return true;
      return [item.name, item.description, item.category, item.subcategory, item.brand]
        .some((value) => normalizeText(value).includes(needle));
    });
  }, [activeItems, query, category]);

  const catalogUrl = `${linkApp}/catalog/${encodeURIComponent(slug || "")}`;
  const qrImageUrl = `https://quickchart.io/qr?size=320&text=${encodeURIComponent(catalogUrl)}`;

  const copyCatalogUrl = async () => {
    try {
      await navigator.clipboard.writeText(catalogUrl);
    } catch {
      window.prompt("Copie o link do catálogo:", catalogUrl);
    }
  };

  const shareCatalog = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: establishment?.fantasy || establishment?.name || "Catálogo Nexus",
          text: "Confira nosso catálogo online na Nexus.",
          url: catalogUrl,
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }
    await copyCatalogUrl();
  };

  if (loading) {
    return (
      <>
        <GlobalNav />
        <div className="catalog-loading">
          <Spinner animation="border" />
          <span>Carregando catálogo...</span>
        </div>
      </>
    );
  }

  if (apiError || !establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5">
          <Alert variant="danger">{apiError || "Catálogo não encontrado."}</Alert>
        </Container>
      </>
    );
  }

  const title = establishment.fantasy || establishment.name;
  const logo = establishment?.images?.logo || establishment.logo;
  const background = establishment?.images?.background || establishment.background;

  return (
    <div className="catalog-page">
      <GlobalNav />

      <section
        className="catalog-hero"
        style={background ? {
          backgroundImage: `linear-gradient(rgba(2,8,18,.76), rgba(2,8,18,.92)), url(${background})`,
        } : undefined}
      >
        <Container>
          <div className="catalog-hero__content">
            {logo && <img src={logo} alt={title} className="catalog-hero__logo" />}
            <div>
              <Badge bg="info" text="dark" className="mb-2">Catálogo online</Badge>
              <h1>{title}</h1>
              {establishment.description && <p>{establishment.description}</p>}
              <div className="catalog-hero__meta">
                {[establishment.city, establishment.uf].filter(Boolean).join(" / ")}
              </div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="catalog-content py-4">
        <section className="catalog-toolbar" aria-label="Filtros do catálogo">
          <Form.Control
            type="search"
            placeholder="Buscar por nome, descrição, categoria ou marca"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <Form.Select value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </Form.Select>
          <span className="catalog-toolbar__count">
            {filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}
          </span>
        </section>

        {filteredItems.length === 0 ? (
          <Alert variant="secondary" className="mt-4">
            Nenhum item encontrado com os filtros selecionados.
          </Alert>
        ) : (
          <Row className="g-4 mt-1">
            {filteredItems.map((item) => (
              <Col key={item.id} xs={12} sm={6} lg={4} xl={3}>
                <GlobalCard
                  item={item}
                  fmtBRL={fmtBRL}
                  navigate={navigate}
                  showSchedule={false}
                />
              </Col>
            ))}
          </Row>
        )}

        <section id="compartilhar" className="catalog-share" aria-labelledby="catalog-share-title">
          <div className="catalog-share__copy">
            <Badge bg="secondary">Divulgação</Badge>
            <h2 id="catalog-share-title">Compartilhe este catálogo</h2>
            <p>
              O QR Code abre diretamente este catálogo público. Use em balcão,
              cartão, embalagem, redes sociais ou materiais impressos.
            </p>
            <div className="catalog-share__url">{catalogUrl}</div>
            <div className="catalog-share__actions">
              <button type="button" onClick={copyCatalogUrl}><FaLink /> Copiar link</button>
              <button type="button" onClick={shareCatalog}>Compartilhar</button>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noreferrer">
                  <FaWhatsapp /> WhatsApp
                </a>
              )}
            </div>
          </div>

          <div className="catalog-share__qr">
            <img src={qrImageUrl} alt={`QR Code do catálogo ${title}`} />
            <a href={qrImageUrl} target="_blank" rel="noreferrer">Abrir QR Code</a>
          </div>
        </section>
      </Container>
    </div>
  );
}
