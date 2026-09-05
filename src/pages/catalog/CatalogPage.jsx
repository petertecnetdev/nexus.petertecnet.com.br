// src/pages/catalog/CatalogPage.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Container, Form, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import { FaCartPlus, FaLink, FaShoppingCart, FaWhatsapp } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import LocalQrCode from "../../components/LocalQrCode";
import NexusFeedback from "../../components/NexusFeedback";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsByIdentifier from "../../hooks/useEstablishmentItemsByIdentifier";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { apiBaseUrl, appId, linkApp } from "../../config";
import { addToCart, cartCount, CART_EVENT } from "../../services/cart";
import { canStartPurchase, getPublicOrdering } from "../../services/ordering";
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
  const { user } = useContext(AuthContext);
  const { establishment, items, loading, apiError } = useEstablishmentItemsByIdentifier(slug);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cartItems, setCartItems] = useState(() => cartCount());
  const [ordering, setOrdering] = useState(null);
  const [orderingLoading, setOrderingLoading] = useState(true);
  const whatsappLink = useWhatsappLink(establishment);

  useEffect(() => {
    const sync = () => setCartItems(cartCount());
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  useEffect(() => {
    let active = true;
    if (!slug || !establishment) {
      setOrdering(null);
      setOrderingLoading(false);
      return () => { active = false; };
    }

    setOrderingLoading(true);
    getPublicOrdering(slug, { silent: true })
      .then((payload) => {
        if (active) setOrdering(payload?.ordering || null);
      })
      .catch(() => {
        if (active) setOrdering(null);
      })
      .finally(() => {
        if (active) setOrderingLoading(false);
      });

    return () => { active = false; };
  }, [establishment, slug]);

  const activeItems = useMemo(() => items.filter((item) => Number(item.status ?? 1) !== 0), [items]);
  const categories = useMemo(
    () => [...new Set(activeItems.map((item) => item.category).filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [activeItems]
  );
  const filteredItems = useMemo(() => {
    const needle = normalizeText(query);
    return activeItems.filter((item) => {
      const matchesCategory = category === "all" || normalizeText(item.category) === normalizeText(category);
      if (!matchesCategory) return false;
      if (!needle) return true;
      return [item.name, item.description, item.category, item.subcategory, item.brand].some((value) => normalizeText(value).includes(needle));
    });
  }, [activeItems, query, category]);

  const hasItems = activeItems.length > 0;
  const hasActiveFilters = normalizeText(query) !== "" || category !== "all";
  const purchaseEnabled = !orderingLoading && canStartPurchase(ordering);
  const purchaseUnavailableReason = orderingLoading
    ? "Verificando disponibilidade para compras…"
    : ordering?.unavailable_reason || (Array.isArray(ordering?.payment_methods) && ordering.payment_methods.length === 0
      ? "As compras estão temporariamente desativadas porque não há forma de pagamento ativa."
      : "As compras estão temporariamente indisponíveis.");
  const catalogUrl = `${linkApp}/catalog/${encodeURIComponent(slug || "")}`;
  const socialShareUrl = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appId)}/directory/share/catalog/${encodeURIComponent(slug || "")}`;
  const title = establishment?.fantasy || establishment?.name || "Catálogo Nexus";
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  const logoCandidates = [establishment?.images?.logo, establishment?.logo, files.find((file) => file?.type === "logo")?.public_url, files.find((file) => file?.is_primary)?.public_url, files[0]?.public_url];
  const socialLogo = logoCandidates.find(Boolean) || null;
  const background = establishment?.images?.background || establishment?.background || files.find((file) => file?.type === "background")?.public_url;
  const pageBackgroundStyle = background
    ? {
        backgroundImage: `linear-gradient(rgba(3,10,20,.90), rgba(3,10,20,.96)), url("${background}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : undefined;
  const heroBackgroundStyle = background
    ? {
        backgroundImage: `linear-gradient(rgba(2,8,18,.24), rgba(2,8,18,.58)), url("${background}")`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }
    : undefined;

  useEffect(() => {
    if (!establishment) return undefined;
    const previousTitle = document.title;
    const description = establishment.description || `Confira o catálogo online de ${title} na Nexus.`;
    document.title = `${title} — Catálogo Nexus`;
    setMeta("description", description); setMeta("og:title", `${title} — Catálogo Nexus`, true); setMeta("og:description", description, true); setMeta("og:type", "website", true); setMeta("og:url", catalogUrl, true);
    if (socialLogo) setMeta("og:image", socialLogo, true);
    setMeta("twitter:card", socialLogo ? "summary_large_image" : "summary"); setMeta("twitter:title", `${title} — Catálogo Nexus`); setMeta("twitter:description", description); if (socialLogo) setMeta("twitter:image", socialLogo);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", catalogUrl);
    return () => { document.title = previousTitle; };
  }, [catalogUrl, establishment, socialLogo, title]);

  const copyCatalogUrl = async () => { try { await navigator.clipboard.writeText(catalogUrl); } catch { window.prompt("Copie o link do catálogo:", catalogUrl); } };
  const shareCatalog = async () => {
    if (navigator.share) { try { await navigator.share({ title, text: "Confira nosso catálogo online na Nexus.", url: socialShareUrl }); return; } catch (error) { if (error?.name === "AbortError") return; } }
    try { await navigator.clipboard.writeText(socialShareUrl); } catch { window.prompt("Copie o link para compartilhar:", socialShareUrl); }
  };

  const goCheckout = () => {
    if (!purchaseEnabled) return;
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };
  const addItem = (item, checkout = false) => {
    if (!purchaseEnabled || Number(item?.status ?? 1) === 0) return;
    addToCart(item, establishment, 1);
    setCartItems(cartCount());
    if (checkout) goCheckout();
  };

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando catálogo…", "Organizando os itens…"]} />;
  if (apiError || !establishment) return <><GlobalNav /><Container className="py-5"><NexusFeedback type="error" title="Catálogo indisponível" actionLabel="Ir para a Nexus" onAction={() => navigate("/")}>{apiError || "Não encontramos este catálogo. Ele pode estar desativado, removido ou o link pode estar incorreto."}</NexusFeedback></Container></>;

  return <div className="catalog-page" style={pageBackgroundStyle}>
    <GlobalNav />
    <section className="catalog-hero" style={heroBackgroundStyle}><Container><div className="catalog-hero__content"><EntityImage src={logoCandidates} name={title} alt={`Imagem de ${title}`} shape="establishment" className="catalog-hero__logo" loading="eager" /><div><Badge bg="info" text="dark" className="mb-2">Catálogo online</Badge><h1>{title}</h1>{establishment.description && <p>{establishment.description}</p>}<div className="catalog-hero__meta">{[establishment.city, establishment.uf].filter(Boolean).join(" / ")}</div></div></div></Container></section>

    <Container className="catalog-content py-4">
      {!orderingLoading && !purchaseEnabled && hasItems && <Alert variant="warning" className="mb-4"><strong>Compras pausadas.</strong> {purchaseUnavailableReason} O catálogo continua disponível apenas para consulta.</Alert>}

      {hasItems && <section className="catalog-toolbar" aria-label="Filtros do catálogo"><Form.Control type="search" aria-label="Buscar itens no catálogo" placeholder="Buscar por nome, descrição, categoria ou marca" value={query} onChange={(event) => setQuery(event.target.value)} /><Form.Select aria-label="Filtrar itens por categoria" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">Todas as categorias</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</Form.Select><span className="catalog-toolbar__count" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}</span>{cartItems > 0 && purchaseEnabled && <Button onClick={goCheckout}><FaShoppingCart /> Carrinho ({cartItems})</Button>}</section>}

      {!hasItems ? <NexusFeedback type="neutral" title="Esta empresa ainda não possui itens cadastrados" className="mt-4">O catálogo de {title} já está disponível na Nexus, mas a empresa ainda não adicionou produtos ou serviços ativos para exibição.</NexusFeedback> : filteredItems.length === 0 && hasActiveFilters ? <NexusFeedback type="neutral" title="Nenhum item encontrado para esta busca" className="mt-4">Não encontramos itens que correspondam aos filtros informados. Tente remover algum filtro ou buscar por outro termo.</NexusFeedback> : <Row className="g-4 mt-1">{filteredItems.map((item) => <Col key={item.id} xs={12} sm={6} lg={4} xl={3}><GlobalCard item={item} fmtBRL={fmtBRL} navigate={navigate} actions={Number(item.price) > 0 ? <div className="d-grid gap-2"><Button size="sm" variant="outline-info" disabled={!purchaseEnabled} title={!purchaseEnabled ? purchaseUnavailableReason : undefined} onClick={() => addItem(item, false)}><FaCartPlus /> Adicionar ao carrinho</Button><Button size="sm" disabled={!purchaseEnabled} title={!purchaseEnabled ? purchaseUnavailableReason : undefined} onClick={() => addItem(item, true)}>Comprar agora</Button></div> : null} /></Col>)}</Row>}

      <section id="compartilhar" className="catalog-share" aria-labelledby="catalog-share-title"><div className="catalog-share__copy"><Badge bg="secondary">Divulgação</Badge><h2 id="catalog-share-title">Compartilhe este catálogo</h2><p>O QR Code é gerado dentro da própria Nexus. O compartilhamento social usa uma prévia renderizada pela API para WhatsApp e outros robôs de link.</p><div className="catalog-share__url">{catalogUrl}</div><div className="catalog-share__actions"><button type="button" onClick={copyCatalogUrl}><FaLink /> Copiar link</button><button type="button" onClick={shareCatalog}>Compartilhar</button>{whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}</div></div><div className="catalog-share__qr"><LocalQrCode value={catalogUrl} title={title} /></div></section>
    </Container>
  </div>;
}
