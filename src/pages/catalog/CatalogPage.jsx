// src/pages/catalog/CatalogPage.jsx
import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Badge, Button, Col, Container, Form, Row } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaCartPlus, FaLink, FaShoppingCart, FaWhatsapp } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import LocalQrCode from "../../components/LocalQrCode";
import NexusFeedback from "../../components/NexusFeedback";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsByIdentifier from "../../hooks/useEstablishmentItemsByIdentifier";
import { apiBaseUrl, appId, linkApp } from "../../config";
import { addToCart, cartCount, CART_EVENT } from "../../services/cart";
import { canStartPurchase, getPublicOrdering } from "../../services/ordering";
import { trackExperienceEvent } from "../../services/experienceTelemetry";
import { catalogSearchText, pricingPresentation } from "../../utils/catalogExperience";
import "./CatalogPage.css";

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const slugify = (value) => normalizeText(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

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
  const { slug, categorySlug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { establishment, items, loading, apiError } = useEstablishmentItemsByIdentifier(slug);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [cartItems, setCartItems] = useState(() => cartCount());
  const [ordering, setOrdering] = useState(null);
  const [orderingLoading, setOrderingLoading] = useState(true);
  const catalogTrackedRef = useRef(null);

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

  const activeItems = useMemo(() => items
    .filter((item) => Number(item.status ?? 1) !== 0 && !item.archived_at)
    .sort((a, b) => Number(b.is_featured || 0) - Number(a.is_featured || 0) || Number(a.sort_order ?? 100) - Number(b.sort_order ?? 100) || String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")), [items]);
  const categories = useMemo(
    () => [...new Set(activeItems.map((item) => item.category).filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [activeItems]
  );

  useEffect(() => {
    if (!categorySlug) {
      if (category !== "all") setCategory("all");
      return;
    }
    const matched = categories.find((value) => slugify(value) === categorySlug);
    if (matched && matched !== category) setCategory(matched);
  }, [categorySlug, categories, category]);
  const filteredItems = useMemo(() => {
    const needle = normalizeText(query);
    return activeItems.filter((item) => {
      const matchesCategory = category === "all" || normalizeText(item.category) === normalizeText(category);
      if (!matchesCategory) return false;
      if (!needle) return true;
      return catalogSearchText(item).includes(needle);
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
  const catalogUrl = categorySlug
    ? `${linkApp}/catalog/${encodeURIComponent(slug || "")}/categoria/${encodeURIComponent(categorySlug)}`
    : `${linkApp}/catalog/${encodeURIComponent(slug || "")}`;
  const socialShareUrl = `${apiBaseUrl}/v1/apps/${encodeURIComponent(appId)}/directory/share/catalog/${encodeURIComponent(slug || "")}`;
  const title = establishment?.fantasy || establishment?.name || "Catálogo Nexus";
  const shareText = `Confira o catálogo online de ${title}: ${socialShareUrl}`;
  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(shareText)}`;
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  const logoCandidates = [establishment?.images?.logo, establishment?.logo, files.find((file) => file?.type === "logo")?.public_url, files.find((file) => file?.is_primary)?.public_url, files[0]?.public_url];
  const socialLogo = logoCandidates.find(Boolean) || null;
  const background = establishment?.images?.background || establishment?.background || files.find((file) => file?.type === "background")?.public_url;
  const pageBackgroundStyle = background
    ? { backgroundImage: `linear-gradient(rgba(3,10,20,.90), rgba(3,10,20,.96)), url("${background}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : undefined;
  const heroBackgroundStyle = background
    ? { backgroundImage: `linear-gradient(rgba(2,8,18,.24), rgba(2,8,18,.58)), url("${background}")`, backgroundSize: "cover", backgroundPosition: "center", backgroundRepeat: "no-repeat" }
    : undefined;

  useEffect(() => {
    if (!establishment || !slug) return;
    const trackingKey = `${appId}:${slug}`;
    if (catalogTrackedRef.current === trackingKey) return;
    catalogTrackedRef.current = trackingKey;
    trackExperienceEvent("navigation", "catalog_viewed", "catalog", {
      application_id: appId,
      establishment_slug: slug,
      establishment_id: establishment?.id,
      item_count: activeItems.length,
      referrer: document.referrer || undefined,
    });
  }, [activeItems.length, establishment, slug]);

  useEffect(() => {
    if (!establishment) return undefined;
    const previousTitle = document.title;
    const description = establishment.description || `Confira o catálogo online de ${title} na Nexus.`;
    const seoTitle = category !== "all" ? `${category} | ${title} — Nexus` : `${title} — Catálogo Nexus`;
    const seoDescription = category !== "all" ? `${category} de ${title}. ${description}`.slice(0, 160) : description;
    document.title = seoTitle;
    setMeta("description", seoDescription); setMeta("og:title", seoTitle, true); setMeta("og:description", seoDescription, true); setMeta("og:type", "website", true); setMeta("og:url", catalogUrl, true);
    if (socialLogo) setMeta("og:image", socialLogo, true);
    setMeta("twitter:card", socialLogo ? "summary_large_image" : "summary"); setMeta("twitter:title", seoTitle); setMeta("twitter:description", seoDescription); if (socialLogo) setMeta("twitter:image", socialLogo);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) { canonical = document.createElement("link"); canonical.setAttribute("rel", "canonical"); document.head.appendChild(canonical); }
    canonical.setAttribute("href", catalogUrl);
    return () => { document.title = previousTitle; };
  }, [catalogUrl, category, establishment, socialLogo, title]);

  const baseCommerceMetadata = () => ({
    application_id: appId,
    establishment_slug: slug,
    establishment_id: establishment?.id,
    cart_items: cartCount(),
  });
  const trackShare = (channel) => trackExperienceEvent("click", "catalog_shared", channel, { ...baseCommerceMetadata(), channel });
  const copyCatalogUrl = async () => {
    try { await navigator.clipboard.writeText(socialShareUrl); } catch { window.prompt("Copie o link do catálogo:", socialShareUrl); }
    trackShare("copy_link");
  };
  const shareCatalog = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: `Confira o catálogo online de ${title} na Nexus.`, url: socialShareUrl });
        trackShare("native_share");
        return;
      } catch (error) { if (error?.name === "AbortError") return; }
    }
    try { await navigator.clipboard.writeText(socialShareUrl); } catch { window.prompt("Copie o link para compartilhar:", socialShareUrl); }
    trackShare("share_fallback_copy");
  };
  const shareWhatsapp = () => trackShare("whatsapp");

  const goCheckout = (source = "cart") => {
    if (!purchaseEnabled) return;
    trackExperienceEvent("click", "checkout_started", source, {
      ...baseCommerceMetadata(),
      authenticated: Boolean(user),
      source,
    });
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };
  const addItem = (item, checkout = false) => {
    if (!purchaseEnabled || Number(item?.status ?? 1) === 0) return;
    addToCart(item, establishment, 1);
    setCartItems(cartCount());
    trackExperienceEvent("click", checkout ? "buy_now_clicked" : "cart_item_added", `item:${item?.id || "unknown"}`, {
      ...baseCommerceMetadata(),
      item_id: item?.id,
      item_name: item?.name,
      item_price: Number(item?.price || 0),
      category: item?.category,
    });
    if (checkout) goCheckout("buy_now");
  };

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando catálogo…", "Organizando os itens…"]} />;
  if (apiError || !establishment) return <><GlobalNav /><Container className="py-5"><NexusFeedback type="error" title="Catálogo indisponível" actionLabel="Ir para a Nexus" onAction={() => navigate("/")}>{apiError || "Não encontramos este catálogo. Ele pode estar desativado, removido ou o link pode estar incorreto."}</NexusFeedback></Container></>;

  return <div className="catalog-page" style={pageBackgroundStyle}>
    <GlobalNav />
    <section className="catalog-hero" style={heroBackgroundStyle}><Container><div className="catalog-hero__content"><EntityImage src={logoCandidates} name={title} alt={`Imagem de ${title}`} shape="establishment" className="catalog-hero__logo" loading="eager" /><div><Badge bg="info" text="dark" className="mb-2">Catálogo online</Badge><h1>{title}</h1>{establishment.description && <p>{establishment.description}</p>}<div className="catalog-hero__meta">{[establishment.city, establishment.uf].filter(Boolean).join(" / ")}</div></div></div></Container></section>

    <Container className="catalog-content py-4">
      {!orderingLoading && !purchaseEnabled && hasItems && <Alert variant="warning" className="mb-4"><strong>Compras pausadas.</strong> {purchaseUnavailableReason} O catálogo continua disponível apenas para consulta.</Alert>}

      {hasItems && categories.length > 0 && <nav className="catalog-category-links" aria-label="Categorias do catálogo"><Link className={category === "all" ? "active" : ""} to={`/catalog/${slug}`}>Todos</Link>{categories.map((value) => <Link key={value} className={category === value ? "active" : ""} to={`/catalog/${slug}/categoria/${slugify(value)}`}>{value}</Link>)}</nav>}

      {hasItems && <section className="catalog-toolbar" aria-label="Filtros do catálogo"><Form.Control type="search" aria-label="Buscar itens no catálogo" placeholder="Busque pelo problema, objetivo, serviço ou tecnologia" value={query} onChange={(event) => setQuery(event.target.value)} /><Form.Select aria-label="Filtrar itens por categoria" value={category} onChange={(event) => { const value = event.target.value; setCategory(value); navigate(value === "all" ? `/catalog/${slug}` : `/catalog/${slug}/categoria/${slugify(value)}`); }}><option value="all">Todas as categorias</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</Form.Select><span className="catalog-toolbar__count" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? "item" : "itens"}</span>{cartItems > 0 && purchaseEnabled && <Button onClick={() => goCheckout("catalog_cart")}><FaShoppingCart /> Carrinho ({cartItems})</Button>}</section>}

      {!hasItems ? <NexusFeedback type="neutral" title="Esta empresa ainda não possui itens cadastrados" className="mt-4">O catálogo de {title} já está disponível na Nexus, mas a empresa ainda não adicionou produtos ou serviços ativos para exibição.</NexusFeedback> : filteredItems.length === 0 && hasActiveFilters ? <NexusFeedback type="neutral" title="Nenhum item encontrado para esta busca" className="mt-4">Não encontramos itens que correspondam aos filtros informados. Tente remover algum filtro ou buscar por outro termo.</NexusFeedback> : <Row className="g-4 mt-1">{filteredItems.map((item) => <Col key={item.id} xs={12} sm={6} lg={4} xl={3}><GlobalCard item={item} navigate={navigate} actions={item.is_checkout_enabled !== false && pricingPresentation(item).checkoutAmount > 0 ? <div className="d-grid gap-2"><Button size="sm" variant="outline-info" disabled={!purchaseEnabled} title={!purchaseEnabled ? purchaseUnavailableReason : undefined} onClick={() => addItem(item, false)}><FaCartPlus /> Adicionar ao carrinho</Button><Button size="sm" disabled={!purchaseEnabled} title={!purchaseEnabled ? purchaseUnavailableReason : undefined} onClick={() => addItem(item, true)}>Comprar agora</Button></div> : null} /></Col>)}</Row>}

      <section id="compartilhar" className="catalog-share" aria-labelledby="catalog-share-title"><div className="catalog-share__copy"><Badge bg="secondary">Divulgação</Badge><h2 id="catalog-share-title">Compartilhe este catálogo</h2><p>O QR Code é gerado dentro da própria Nexus. Os links de compartilhamento usam a prévia renderizada pela API para WhatsApp e outros robôs de link.</p><div className="catalog-share__url">{catalogUrl}</div><div className="catalog-share__actions"><button type="button" onClick={copyCatalogUrl}><FaLink /> Copiar link</button><button type="button" onClick={shareCatalog}>Compartilhar</button><a href={whatsappShareUrl} target="_blank" rel="noreferrer" onClick={shareWhatsapp}><FaWhatsapp /> WhatsApp</a></div></div><div className="catalog-share__qr"><LocalQrCode value={catalogUrl} title={title} /></div></section>
    </Container>
  </div>;
}
