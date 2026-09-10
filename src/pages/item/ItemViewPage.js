// src/pages/item/ItemViewPage.jsx
import React, { useContext, useEffect } from "react";
import { Badge, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaCartPlus, FaEye, FaPen, FaTag, FaWhatsapp } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import GlobalWhatsappButton from "../../components/GlobalWhatsappButton";
import ShareButton from "../../components/ShareButton";
import useImageUtils from "../../hooks/useImageUtils";
import useItemView from "../../hooks/useItemView";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { addToCart } from "../../services/cart";
import "./ItemViewPage.css";

const SITE_URL = "https://nexus.petertecnet.com.br";
const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
const hasPrice = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

const setMeta = (name, content, property = false) => {
  if (!content) return;
  const selector = property ? `meta[property="${name}"]` : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.rel = "canonical";
    document.head.appendChild(element);
  }
  element.href = href;
};

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { imageUrl } = useImageUtils();
  const { item, otherItems, establishment, loading, error } = useItemView(slug);
  const whatsappLink = useWhatsappLink(establishment);
  const whatsappMessage = `Olá, gostaria de saber mais informações sobre o item "${item?.name || item?.title || "selecionado"}". Você poderia me ajudar?`;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  useEffect(() => {
    if (!item) return undefined;

    const itemName = item.name || item.title || "Item";
    const companyName = establishment?.fantasy || establishment?.name;
    const description = String(
      item.short_description ||
      item.description ||
      `${itemName}${companyName ? ` de ${companyName}` : ""}: veja detalhes, preço e disponibilidade na Nexus.`
    ).replace(/\s+/g, " ").trim().slice(0, 160);
    const canonical = `${SITE_URL}/item/view/${encodeURIComponent(slug || item.slug || item.id)}`;
    const files = Array.isArray(item.files) ? item.files : [];
    const imageCandidate = [
      item.imageUrl,
      item.image_url,
      item.image,
      item.images?.cover,
      item.images?.main,
      item.images?.avatar,
      item.images?.gallery?.[0],
      files.find((file) => file?.is_primary)?.public_url,
      files.find((file) => file?.type === "image")?.public_url,
      files[0]?.public_url,
    ].find(Boolean);
    const socialImage = imageCandidate ? imageUrl(imageCandidate) : null;
    const pageTitle = `${itemName}${companyName ? ` | ${companyName}` : ""} — Nexus`;

    document.title = pageTitle;
    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "product", true);
    setMeta("og:url", canonical, true);
    if (socialImage) setMeta("og:image", socialImage, true);
    setMeta("twitter:card", socialImage ? "summary_large_image" : "summary");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", description);
    if (socialImage) setMeta("twitter:image", socialImage);
    setCanonical(canonical);

    const structuredData = {
      "@context": "https://schema.org",
      "@type": String(item.type || "").toLowerCase().includes("serv") ? "Service" : "Product",
      name: itemName,
      description,
      url: canonical,
      ...(socialImage ? { image: socialImage } : {}),
      ...(item.brand ? { brand: { "@type": "Brand", name: item.brand } } : {}),
      ...(companyName ? { provider: { "@type": "Organization", name: companyName } } : {}),
      ...(hasPrice(item.price) ? {
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: Number(item.price).toFixed(2),
          url: canonical,
          availability: "https://schema.org/InStock",
        },
      } : {}),
    };

    const scriptId = "nexus-item-structured-data";
    let script = document.getElementById(scriptId);
    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.type = "application/ld+json";
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);

    return () => script?.remove();
  }, [establishment, imageUrl, item, slug]);

  if (loading) return <><GlobalNav /><div className="item-detail-loading"><Spinner animation="border" /></div></>;
  if (error || !item) return <><GlobalNav /><Container className="py-5"><div className="alert alert-danger">Não foi possível carregar este item.</div></Container></>;

  const itemFiles = Array.isArray(item.files) ? item.files : [];
  const itemImages = [item.imageUrl, item.image_url, item.image, item.images?.cover, item.images?.main, item.images?.avatar, item.images?.gallery?.[0], itemFiles.find((file) => file?.is_primary)?.public_url, itemFiles.find((file) => file?.type === "image")?.public_url, itemFiles[0]?.public_url];
  const title = establishment?.fantasy || establishment?.name;
  const catalogPath = establishment?.slug ? `/catalog/${establishment.slug}` : "/";
  const canEdit = Boolean(user && (Number(item.user_id) === Number(user.id) || Number(establishment?.user_id) === Number(user.id) || Number(establishment?.created_by) === Number(user.id)));
  const canBuy = Boolean(hasPrice(item.price) && Number(item.price) > 0 && establishment?.id);

  const buy = (checkout) => {
    addToCart(item, establishment, 1);
    if (!checkout) return;
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  return <div className="item-detail-page">
    <GlobalNav />
    <Container className="py-4 py-lg-5">
      <div className="item-detail-toolbar"><Link to={catalogPath} className="item-detail-back"><FaArrowLeft /> Voltar ao catálogo</Link>{canEdit && <button type="button" className="item-detail-edit" onClick={() => navigate(`/item/update/${item.id}`)}><FaPen /> Editar item</button>}</div>
      <Row className="g-4 align-items-start mt-1">
        <Col lg={6}><div className="item-detail-image-wrap"><EntityImage src={itemImages} name={item.name} alt={item.name} className="item-detail-image" loading="eager" /></div></Col>
        <Col lg={6}><div className="item-detail-panel">
          <div className="d-flex flex-wrap gap-2 mb-3">{item.type && <Badge bg="info" text="dark">{item.type}</Badge>}{item.category && <Badge bg="secondary">{item.category}</Badge>}{item.subcategory && <Badge bg="secondary">{item.subcategory}</Badge>}{item.total_views != null && <span className="item-detail-views"><FaEye /> {Number(item.total_views || 0).toLocaleString("pt-BR")} visualizações</span>}</div>
          <h1>{item.name}</h1>{title && <Link to={catalogPath} className="item-detail-company">{title}</Link>}{hasPrice(item.price) && <div className="item-detail-price">{fmtBRL(item.price)}</div>}
          <div className="item-detail-facts">{item.brand && <span><FaTag /> Marca: {item.brand}</span>}{item.availability && <span>Disponibilidade: {item.availability}</span>}{item.status_label && <span>Status: {item.status_label}</span>}</div>
          {item.short_description && <p className="item-detail-summary">{item.short_description}</p>}{item.description && <div className="item-detail-description"><h2>Descrição</h2><p>{item.description}</p></div>}
          {canBuy && <div className="d-grid gap-2 mb-3"><Button variant="outline-info" onClick={() => buy(false)}><FaCartPlus /> Adicionar ao carrinho</Button><Button onClick={() => buy(true)}>Comprar agora</Button></div>}
          <div className="item-detail-actions">{whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer" className="item-detail-whatsapp"><FaWhatsapp /> Pedir informações</a>}<button type="button" onClick={() => navigate(catalogPath)}>Ver catálogo completo</button>{canEdit && <button type="button" className="item-detail-edit-secondary" onClick={() => navigate(`/item/update/${item.id}`)}><FaPen /> Alterar este item</button>}</div>
        </div></Col>
      </Row>
      {otherItems?.length > 0 && <section className="item-detail-related"><h2>Outros itens deste catálogo</h2><Row className="g-3">{otherItems.slice(0, 8).map((related) => <Col key={related.id} xs={12} sm={6} lg={3}><GlobalCard item={related} fmtBRL={fmtBRL} navigate={navigate} /></Col>)}</Row></section>}
    </Container>
    <GlobalWhatsappButton link={whatsappLink} message={whatsappMessage} />
    <ShareButton />
  </div>;
}
