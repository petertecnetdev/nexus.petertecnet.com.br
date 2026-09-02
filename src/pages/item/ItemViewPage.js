// src/pages/item/ItemViewPage.jsx
import React, { useContext, useEffect, useState } from "react";
import { Badge, Button, Col, Container, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaCartPlus, FaEye, FaGoogle, FaLink, FaPen, FaShareAlt, FaStore, FaTag, FaWhatsapp } from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import LocalQrCode from "../../components/LocalQrCode";
import ShareButton from "../../components/ShareButton";
import useItemView from "../../hooks/useItemView";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { apiBaseUrl, appId, linkApp } from "../../config";
import { addToCart } from "../../services/cart";
import "./ItemViewPage.css";

const fmtBRL = (value) => `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;
const hasPrice = (value) => value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

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

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { item, otherItems, establishment, loading, error } = useItemView(slug);
  const whatsappLink = useWhatsappLink(establishment);
  const [copied, setCopied] = useState(false);

  const currentItemSlug = item?.slug || slug || "";
  const itemUrl = `${linkApp}/item/${encodeURIComponent(currentItemSlug)}`;
  const socialShareUrl = `${apiBaseUrl}/nexus/share/item/${encodeURIComponent(currentItemSlug)}?app_id=${encodeURIComponent(appId)}`;
  const itemFiles = Array.isArray(item?.files) ? item.files : [];
  const itemImages = [
    item?.imageUrl,
    item?.image_url,
    item?.image,
    item?.images?.cover,
    item?.images?.main,
    item?.images?.avatar,
    item?.images?.gallery?.[0],
    itemFiles.find((file) => file?.is_primary)?.public_url,
    itemFiles.find((file) => file?.type === "image")?.public_url,
    itemFiles[0]?.public_url,
  ];
  const socialImage = itemImages.find(Boolean) || null;
  const companyTitle = establishment?.fantasy || establishment?.name;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [slug]);

  useEffect(() => {
    if (!item) return undefined;
    const previousTitle = document.title;
    const description = item.short_description || item.description || `Confira ${item.name} na Nexus.`;
    const fullTitle = companyTitle ? `${item.name} — ${companyTitle}` : `${item.name} — Nexus`;

    document.title = fullTitle;
    setMeta("description", description);
    setMeta("og:title", fullTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "product", true);
    setMeta("og:url", itemUrl, true);
    if (socialImage) setMeta("og:image", socialImage, true);
    setMeta("twitter:card", socialImage ? "summary_large_image" : "summary");
    setMeta("twitter:title", fullTitle);
    setMeta("twitter:description", description);
    if (socialImage) setMeta("twitter:image", socialImage);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", itemUrl);

    return () => { document.title = previousTitle; };
  }, [companyTitle, item, itemUrl, socialImage]);

  if (loading) return <><GlobalNav /><div className="item-detail-loading"><Spinner animation="border" /></div></>;
  if (error || !item) return <><GlobalNav /><Container className="py-5"><div className="alert alert-danger">Não foi possível carregar este item.</div></Container></>;

  const title = companyTitle;
  const catalogPath = establishment?.slug ? `/catalog/${establishment.slug}` : "/";
  const canEdit = Boolean(user && (Number(item.user_id) === Number(user.id) || Number(establishment?.user_id) === Number(user.id) || Number(establishment?.created_by) === Number(user.id)));
  const canBuy = Boolean(hasPrice(item.price) && Number(item.price) > 0 && establishment?.id);

  const buy = (checkout) => {
    addToCart(item, establishment, 1);
    if (!checkout) return;
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  const copyItemUrl = async () => {
    try {
      await navigator.clipboard.writeText(itemUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt("Copie o link deste item:", itemUrl);
    }
  };

  const copySocialShareUrl = async () => {
    try { await navigator.clipboard.writeText(socialShareUrl); }
    catch { window.prompt("Copie o link para compartilhar:", socialShareUrl); }
  };

  const shareItem = async () => {
    const shareData = {
      title: item.name,
      text: item.short_description || `Confira ${item.name}${title ? ` de ${title}` : ""} na Nexus.`,
      url: socialShareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (shareError) {
        if (shareError?.name === "AbortError") return;
      }
    }
    await copySocialShareUrl();
  };

  return (
    <div className="item-detail-page">
      <GlobalNav />
      <Container className="py-4 py-lg-5">
        <div className="item-detail-toolbar">
          <Link to={catalogPath} className="item-detail-back"><FaArrowLeft /> Voltar ao catálogo</Link>
          {canEdit && <button type="button" className="item-detail-edit" onClick={() => navigate(`/item/update/${item.id}`)}><FaPen /> Editar item</button>}
        </div>

        <Row className="g-4 align-items-start mt-1">
          <Col lg={6}>
            <div className="item-detail-image-wrap">
              <EntityImage src={itemImages} name={item.name} alt={item.name} className="item-detail-image" loading="eager" />
            </div>
          </Col>

          <Col lg={6}>
            <div className="item-detail-panel">
              <div className="d-flex flex-wrap gap-2 mb-3">
                {item.type && <Badge bg="info" text="dark">{item.type}</Badge>}
                {item.category && <Badge bg="secondary">{item.category}</Badge>}
                {item.subcategory && <Badge bg="secondary">{item.subcategory}</Badge>}
                {item.total_views != null && <span className="item-detail-views"><FaEye /> {Number(item.total_views || 0).toLocaleString("pt-BR")} visualizações</span>}
              </div>

              <h1>{item.name}</h1>
              {title && <Link to={catalogPath} className="item-detail-company">{title}</Link>}
              {hasPrice(item.price) && <div className="item-detail-price">{fmtBRL(item.price)}</div>}
              <div className="item-detail-facts">
                {item.brand && <span><FaTag /> Marca: {item.brand}</span>}
                {item.availability && <span>Disponibilidade: {item.availability}</span>}
                {item.status_label && <span>Status: {item.status_label}</span>}
              </div>
              {item.short_description && <p className="item-detail-summary">{item.short_description}</p>}
              {item.description && <div className="item-detail-description"><h2>Descrição</h2><p>{item.description}</p></div>}

              {canBuy && (
                <div className="item-detail-commerce">
                  <Button variant="outline-info" onClick={() => buy(false)}><FaCartPlus /> Adicionar ao carrinho</Button>
                  <Button onClick={() => buy(true)}>Comprar agora</Button>
                </div>
              )}

              <div className="item-detail-actions">
                {whatsappLink && <a href={whatsappLink} target="_blank" rel="noreferrer" className="item-detail-whatsapp"><FaWhatsapp /> Pedir informações</a>}
                <button type="button" onClick={shareItem}><FaShareAlt /> Compartilhar</button>
                <button type="button" onClick={() => navigate(catalogPath)}>Ver catálogo completo</button>
                {canEdit && <button type="button" className="item-detail-edit-secondary" onClick={() => navigate(`/item/update/${item.id}`)}><FaPen /> Alterar este item</button>}
              </div>
            </div>
          </Col>
        </Row>

        <section className="item-detail-qr" aria-labelledby="item-detail-qr-title">
          <div className="item-detail-qr__copy">
            <span>Acesso direto</span>
            <h2 id="item-detail-qr-title">Este item tem um QR Code próprio</h2>
            <p>Mostre este QR na tela ou envie o link. A pessoa abre exatamente este produto ou serviço, sem precisar procurar dentro do catálogo e sem precisar criar conta.</p>
            <div className="item-detail-qr__url">{itemUrl}</div>
            <div className="item-detail-qr__actions">
              <button type="button" onClick={copyItemUrl}><FaLink /> {copied ? "Link copiado" : "Copiar link"}</button>
              <button type="button" onClick={shareItem}><FaShareAlt /> Compartilhar item</button>
            </div>
          </div>
          <div className="item-detail-qr__code">
            <LocalQrCode value={itemUrl} title={item.name} size={280} />
          </div>
        </section>

        {!user && (
          <section className="item-detail-growth" aria-labelledby="item-detail-growth-title">
            <div className="item-detail-growth__icon"><FaStore aria-hidden="true" /></div>
            <div>
              <span>Divulgue sem criar barreiras</span>
              <h2 id="item-detail-growth-title">Tenha um catálogo com QR Codes como este</h2>
              <p>Na Nexus, seus clientes podem conhecer a empresa e os itens primeiro. O cadastro fica para quando realmente fizer sentido.</p>
            </div>
            <div className="item-detail-growth__actions">
              <Link to="/register">Criar meu catálogo <FaArrowRight /></Link>
              <Link to="/login" className="item-detail-growth__google"><FaGoogle /> Entrar com Google</Link>
            </div>
          </section>
        )}

        {otherItems?.length > 0 && (
          <section className="item-detail-related">
            <div className="item-detail-related__heading">
              <div><span>Continue explorando</span><h2>Outros itens deste catálogo</h2></div>
              <Link to={catalogPath}>Ver catálogo completo <FaArrowRight /></Link>
            </div>
            <Row className="g-3">
              {otherItems.slice(0, 8).map((related) => (
                <Col key={related.id} xs={12} sm={6} lg={3}>
                  <GlobalCard item={related} fmtBRL={fmtBRL} navigate={navigate} showQr publicUrl={`${linkApp}/item/${encodeURIComponent(related.slug || "")}`} />
                </Col>
              ))}
            </Row>
          </section>
        )}
      </Container>
      <ShareButton />
    </div>
  );
}
