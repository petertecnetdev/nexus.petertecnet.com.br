// src/pages/catalog/CatalogPage.jsx
import React, { useContext, useEffect, useMemo, useState } from "react";
import { Badge, Button, Col, Container, Form, Row } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowRight, FaCartPlus, FaGoogle, FaLink, FaSearch, FaShoppingCart, FaStore, FaWhatsapp } from "react-icons/fa";

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
import "./CatalogPage.css";

const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
const normalizeText = (value) => String(value || "").trim().toLowerCase();
const normalizeType = (value) => {
  const type = normalizeText(value);
  if (["service", "servico", "serviço"].includes(type)) return "service";
  if (["product", "produto"].includes(type)) return "product";
  return type || "item";
};

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
  const [typeFilter, setTypeFilter] = useState("all");
  const [sort, setSort] = useState("popular");
  const [cartItems, setCartItems] = useState(() => cartCount());
  const whatsappLink = useWhatsappLink(establishment);

  useEffect(() => {
    const sync = () => setCartItems(cartCount());
    window.addEventListener(CART_EVENT, sync);
    return () => window.removeEventListener(CART_EVENT, sync);
  }, []);

  const activeItems = useMemo(() => items.filter((item) => Number(item.status ?? 1) !== 0), [items]);
  const categories = useMemo(
    () => [...new Set(activeItems.map((item) => item.category).filter(Boolean).map((value) => String(value).trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, "pt-BR")),
    [activeItems]
  );

  const typeCounts = useMemo(() => activeItems.reduce((acc, item) => {
    const type = normalizeType(item.type);
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {}), [activeItems]);

  const filteredItems = useMemo(() => {
    const needle = normalizeText(query);
    const filtered = activeItems.filter((item) => {
      const matchesCategory = category === "all" || normalizeText(item.category) === normalizeText(category);
      const matchesType = typeFilter === "all" || normalizeType(item.type) === typeFilter;
      if (!matchesCategory || !matchesType) return false;
      if (!needle) return true;
      return [item.name, item.description, item.short_description, item.category, item.subcategory, item.brand].some((value) => normalizeText(value).includes(needle));
    });

    return [...filtered].sort((a, b) => {
      if (sort === "name") return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
      if (sort === "price-asc") {
        const aPrice = Number.isFinite(Number(a.price)) ? Number(a.price) : Number.POSITIVE_INFINITY;
        const bPrice = Number.isFinite(Number(b.price)) ? Number(b.price) : Number.POSITIVE_INFINITY;
        return aPrice - bPrice;
      }
      if (sort === "price-desc") {
        const aPrice = Number.isFinite(Number(a.price)) ? Number(a.price) : Number.NEGATIVE_INFINITY;
        const bPrice = Number.isFinite(Number(b.price)) ? Number(b.price) : Number.NEGATIVE_INFINITY;
        return bPrice - aPrice;
      }
      return Number(b.total_views || 0) - Number(a.total_views || 0);
    });
  }, [activeItems, category, query, sort, typeFilter]);

  const hasItems = activeItems.length > 0;
  const hasActiveFilters = normalizeText(query) !== "" || category !== "all" || typeFilter !== "all";
  const catalogUrl = `${linkApp}/catalog/${encodeURIComponent(slug || "")}`;
  const socialShareUrl = `${apiBaseUrl}/nexus/share/catalog/${encodeURIComponent(slug || "")}?app_id=${encodeURIComponent(appId)}`;
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
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", catalogUrl);
    return () => { document.title = previousTitle; };
  }, [catalogUrl, establishment, socialLogo, title]);

  const copyCatalogUrl = async () => {
    try { await navigator.clipboard.writeText(catalogUrl); }
    catch { window.prompt("Copie o link do catálogo:", catalogUrl); }
  };

  const shareCatalog = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: "Confira nosso catálogo online na Nexus.", url: socialShareUrl });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try { await navigator.clipboard.writeText(socialShareUrl); }
    catch { window.prompt("Copie o link para compartilhar:", socialShareUrl); }
  };

  const clearFilters = () => {
    setQuery("");
    setCategory("all");
    setTypeFilter("all");
  };

  const goCheckout = () => {
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  const addItem = (item, checkout = false) => {
    addToCart(item, establishment, 1);
    setCartItems(cartCount());
    if (checkout) goCheckout();
  };

  if (loading) return <ProcessingIndicatorComponent messages={["Carregando catálogo…", "Organizando os itens…"]} />;

  if (apiError || !establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5">
          <NexusFeedback type="error" title="Catálogo indisponível" actionLabel="Ir para a Nexus" onAction={() => navigate("/")}>
            {apiError || "Não encontramos este catálogo. Ele pode ter sido removido ou o link pode estar incorreto."}
          </NexusFeedback>
        </Container>
      </>
    );
  }

  return (
    <div className="catalog-page">
      <GlobalNav />
      <section className="catalog-hero" style={background ? { backgroundImage: `linear-gradient(rgba(2,8,18,.72), rgba(2,8,18,.94)), url(${background})` } : undefined}>
        <Container>
          <div className="catalog-hero__content">
            <EntityImage src={logoCandidates} name={title} alt={`Imagem de ${title}`} shape="establishment" className="catalog-hero__logo" loading="eager" />
            <div className="catalog-hero__copy">
              <Badge bg="info" text="dark" className="mb-2">Catálogo público · acesso sem cadastro</Badge>
              <h1>{title}</h1>
              {establishment.description && <p>{establishment.description}</p>}
              <div className="catalog-hero__meta">{[establishment.city, establishment.uf].filter(Boolean).join(" / ")}</div>
              {hasItems && (
                <div className="catalog-hero__stats" aria-label="Resumo do catálogo">
                  <span><strong>{activeItems.length}</strong> {activeItems.length === 1 ? "item" : "itens"}</span>
                  <span><strong>{categories.length}</strong> {categories.length === 1 ? "categoria" : "categorias"}</span>
                  {(typeCounts.service || 0) > 0 && <span><strong>{typeCounts.service}</strong> serviços</span>}
                  {(typeCounts.product || 0) > 0 && <span><strong>{typeCounts.product}</strong> produtos</span>}
                </div>
              )}
            </div>
          </div>
        </Container>
      </section>

      <Container className="catalog-content py-4">
        {hasItems && (
          <>
            <section className="catalog-discovery" aria-labelledby="catalog-discovery-title">
              <div>
                <span className="catalog-eyebrow">Explore do seu jeito</span>
                <h2 id="catalog-discovery-title">Encontre o que você procura mais rápido</h2>
                <p>Busque, filtre por categoria e abra o QR individual de qualquer item sem precisar fazer cadastro.</p>
              </div>
            </section>

            <section className="catalog-toolbar" aria-label="Filtros do catálogo">
              <div className="catalog-search">
                <FaSearch aria-hidden="true" />
                <Form.Control type="search" aria-label="Buscar itens no catálogo" placeholder="Buscar por nome, descrição, categoria ou marca" value={query} onChange={(event) => setQuery(event.target.value)} />
              </div>

              <div className="catalog-toolbar__controls">
                <Form.Select aria-label="Filtrar itens por tipo" value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
                  <option value="all">Produtos e serviços</option>
                  {(typeCounts.product || 0) > 0 && <option value="product">Produtos ({typeCounts.product})</option>}
                  {(typeCounts.service || 0) > 0 && <option value="service">Serviços ({typeCounts.service})</option>}
                </Form.Select>
                <Form.Select aria-label="Ordenar itens" value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="popular">Mais vistos primeiro</option>
                  <option value="name">Nome A–Z</option>
                  <option value="price-asc">Menor preço</option>
                  <option value="price-desc">Maior preço</option>
                </Form.Select>
                <span className="catalog-toolbar__count" aria-live="polite">{filteredItems.length} {filteredItems.length === 1 ? "resultado" : "resultados"}</span>
                {cartItems > 0 && <Button className="catalog-cart-button" onClick={goCheckout}><FaShoppingCart /> Carrinho ({cartItems})</Button>}
              </div>

              <div className="catalog-category-strip" aria-label="Categorias">
                <button type="button" className={category === "all" ? "is-active" : ""} onClick={() => setCategory("all")}>Tudo <span>{activeItems.length}</span></button>
                {categories.map((value) => {
                  const count = activeItems.filter((item) => normalizeText(item.category) === normalizeText(value)).length;
                  return <button type="button" key={value} className={category === value ? "is-active" : ""} onClick={() => setCategory(value)}>{value} <span>{count}</span></button>;
                })}
              </div>
            </section>
          </>
        )}

        {!hasItems ? (
          <NexusFeedback type="neutral" title="Esta empresa ainda não possui itens cadastrados" className="mt-4">
            O catálogo de {title} já está disponível na Nexus, mas a empresa ainda não adicionou produtos ou serviços para exibição.
          </NexusFeedback>
        ) : filteredItems.length === 0 && hasActiveFilters ? (
          <div className="catalog-empty-filter">
            <NexusFeedback type="neutral" title="Nenhum item encontrado para esta busca" className="mt-4">
              Não encontramos itens que correspondam aos filtros informados. Tente outro termo ou limpe os filtros.
            </NexusFeedback>
            <button type="button" onClick={clearFilters}>Limpar filtros</button>
          </div>
        ) : (
          <Row className="g-4 mt-1">
            {filteredItems.map((item) => (
              <Col key={item.id} xs={12} sm={6} lg={4} xl={3}>
                <GlobalCard
                  item={item}
                  fmtBRL={fmtBRL}
                  navigate={navigate}
                  showQr
                  publicUrl={`${linkApp}/item/${encodeURIComponent(item.slug || "")}`}
                  actions={hasPriceForCommerce(item.price) ? (
                    <div className="d-grid gap-2">
                      <Button size="sm" variant="outline-info" onClick={() => addItem(item, false)}><FaCartPlus /> Adicionar ao carrinho</Button>
                      <Button size="sm" onClick={() => addItem(item, true)}>Comprar agora</Button>
                    </div>
                  ) : null}
                />
              </Col>
            ))}
          </Row>
        )}

        {!user && (
          <section className="catalog-growth" aria-labelledby="catalog-growth-title">
            <div className="catalog-growth__icon"><FaStore aria-hidden="true" /></div>
            <div className="catalog-growth__copy">
              <span>Feito com Nexus</span>
              <h2 id="catalog-growth-title">Quer divulgar seus produtos assim também?</h2>
              <p>Crie sua conta, cadastre sua empresa e compartilhe um catálogo público por link ou QR Code. Quem recebe consegue abrir na hora, sem cadastro.</p>
            </div>
            <div className="catalog-growth__actions">
              <Link to="/register">Criar meu catálogo <FaArrowRight aria-hidden="true" /></Link>
              <Link to="/login" className="catalog-growth__google"><FaGoogle aria-hidden="true" /> Entrar com Google</Link>
            </div>
          </section>
        )}

        <section id="compartilhar" className="catalog-share" aria-labelledby="catalog-share-title">
          <div className="catalog-share__copy">
            <Badge bg="secondary">Compartilhamento rápido</Badge>
            <h2 id="catalog-share-title">Compartilhe este catálogo em segundos</h2>
            <p>Abra o QR Code na tela, envie o link ou compartilhe pelo WhatsApp. A pessoa chega direto ao catálogo público.</p>
            <div className="catalog-share__url">{catalogUrl}</div>
            <div className="catalog-share__actions">
              <button type="button" onClick={copyCatalogUrl}><FaLink /> Copiar link</button>
              <button type="button" onClick={shareCatalog}>Compartilhar</button>
              {whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer"><FaWhatsapp /> WhatsApp</a>}
            </div>
          </div>
          <div className="catalog-share__qr">
            <LocalQrCode value={catalogUrl} title={title} />
          </div>
        </section>
      </Container>
    </div>
  );
}

const hasPriceForCommerce = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
