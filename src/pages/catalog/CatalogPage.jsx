// src/pages/catalog/CatalogPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Badge, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { FaLink, FaWhatsapp } from "react-icons/fa";

import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import NexusFeedback from "../../components/NexusFeedback";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsByIdentifier from "../../hooks/useEstablishmentItemsByIdentifier";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { linkApp } from "../../config";
import "./CatalogPage.css";

const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
const normalizeText = (value) => String(value || "").trim().toLowerCase();

function setMeta(name, content, property = false) {
  if (!content) return;
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

export default function CatalogPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, items, loading, apiError } = useEstablishmentItemsByIdentifier(slug);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const whatsappLink = useWhatsappLink(establishment);

  const activeItems = useMemo(() => items.filter((item) => Number(item.status ?? 1) !== 0), [items]);
  const categories = useMemo(() => [...new Set(activeItems.map((item) => item.category).filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")), [activeItems]);
  const filteredItems = useMemo(() => {
    const needle = normalizeText(query);
    return activeItems.filter((item) => {
      const matchesCategory = category === "all" || normalizeText(item.category) === normalizeText(category);
      if (!matchesCategory) return false;
      if (!needle) return true;
      return [item.name, item.description, item.category, item.subcategory, item.brand].some((value) => normalizeText(value).includes(needle));
    });
  }, [activeItems, query, category]);

  const catalogUrl = `${linkApp}/catalog/${encodeURIComponent(slug || "")}`;
  const qrImageUrl = `https://quickchart.io/qr?size=320&text=${encodeURIComponent(catalogUrl)}`;
  const title = establishment?.fantasy || establishment?.name || "Catálogo Nexus";
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  const logoCandidates = [
    establishment?.images?.logo,
    establishment?.logo,
    files.find((file) => file?.type === "logo")?.public_url,
    files.find((file) => file?.is_primary)?.public_url,
    files[0]?.public_url,
  ];
  const socialLogo = logoCandidates.find(Boolean) || null;
  const background = establishment?.images?.background || establishment?.background || files.find((file) => file?.type === "background")?.public_url;

  useEffect(() => {
    if (!establishment) return undefined;
    const previousTitle = document.title;
    const description = establishment.description || `Confira o catálogo online de ${title} na Nexus.`;
    document.title = `${title} — Catálogo Nexus`;
    setMeta("description", description);
    setMeta("og:title", `${title} — Catálogo Nexus`, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
    setMeta("og:url", catalogUrl, true);
    if (socialLogo) setMeta("og:image", socialLogo, true);
    setMeta("twitter:card", socialLogo ? "summary_large_image" : "summary");
    setMeta("twitter:title", `${title} — Catálogo Nexus`);
    setMeta("twitter:description", description);
    if (socialLogo) setMeta("twitter:image", socialLogo);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", catalogUrl);
    return () => { document.title = previousTitle; };
  }, [catalogUrl, establishment, socialLogo, title]);

  const copyCatalogUrl = async () => {
    try { await navigator.clipboard.writeText(catalogUrl); }
    catch { window.prompt("Copie o link do catálogo:", catalogUrl); }
  };

  const shareCatalog = async () => {
    if (navigator.share) {
      try { await navigator.share({ title, text: "Confira nosso catálogo online na Nexus.", url: catalogUrl }); return; }
      catch (error) { if (error?.name === "AbortError") return; }
    }
    await copyCatalogUrl();
  };

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando catálogo…", "Organizando os itens…"]} />;

  if (apiError || !establishment) {
    return <><GlobalNav /><Container className="py-5"><NexusFeedback type="error" title="Catálogo indisponível" actionLabel="Ir para a Nexus" onAction={() => navigate("/")}>{apiError || "Não encontramos este catálogo. Ele pode ter sido removido ou o link pode estar incorreto."}</NexusFeedback></Container></>;
  }

  return (
    <div className="catalog-page">
      <GlobalNav />
      <section className="catalog-hero" style={background ? { backgroundImage: `linear-gradient(rgba(2,8,18,.76), rgba(2,8,18,.92)), url(${background})` } : undefined}>
        <Container>
          <div className="catalog-hero__content">
            <EntityImage src={logoCandidates} name={title} alt={`Imagem de ${title}`} shape="establishment" className="catalog-hero__logo" loading="eager" />
            <div>
              <Badge bg="info" text="dark" className="mb-2">Catálogo online</Badge>
              <h1>{title}</h1>
              {establishment.description && <p>{establishment.description}</p>}
              <div className="catalog-hero__meta">{[establishment.city, establishment.uf].filter(Boolean).join(" / ")}</div>
            </div>
          </div>
        </Container>
      </section>

      <Container className="catalog-content py-4">
        <section className="catalog-toolbar" aria-label="Filtros do catálogo">
          <Form.Control type="search" aria-label="Buscar itens no catálogo" placeholder="Buscar por nome, descrição, categoria ou marca" value={query} onChange={(event) => setQuery(event.target.value)} />
          <Form.Select aria-label="Filtrar itens por categoria" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="all">Todas as categorias</option>
            {categories.map((value) => <option key={value} value={value}>{value}</option>)}
          </Form.Select>
          <span className="catalog-toolbar__count" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}</span>
        </section>

        {filteredItems.length === 0 ? <NexusFeedback type="neutral" title="Nenhum item encontrado" className="mt-4">Tente remover algum filtro ou buscar por outro termo.</NexusFeedback> : <Row className="g-4 mt-1">{filteredItems.map((item) => <Col key={item.id} xs={12} sm={6} lg={4} xl={3}><GlobalCard item={item} fmtBRL={fmtBRL} navigate={navigate} showSchedule={false} /></Col>)}</Row>}

        <section id="compartilhar" className="catalog-share" aria-labelledby="catalog-share-title">
          <div className="catalog-share__copy">
            <Badge bg="secondary">Divulgação</Badge><h2 id="catalog-share-title">Compartilhe este catálogo</h2>
            <p>O QR Code abre diretamente este catálogo público. Use em balcão, cartão, embalagem, redes sociais ou materiais impressos.</p>
            <div className="catalog-share__url">{catalogUrl}</div>
            <div className="catalog-share__actions"><button type="button" onClick={copyCatalogUrl}><FaLink /> Copiar link</button><button type="button" onClick={shareCatalog}>Compartilhar</button>{whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}</div>
          </div>
          <div className="catalog-share__qr"><img src={qrImageUrl} alt={`QR Code do catálogo ${title}`} loading="lazy" /><a href={qrImageUrl} target="_blank" rel="noreferrer">Abrir QR Code</a></div>
        </section>
      </Container>
    </div>
  );
}
