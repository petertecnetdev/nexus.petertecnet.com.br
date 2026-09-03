// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useEffect, useMemo } from "react";
import { Badge, Button, Col, Container, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxOpen,
  FaEnvelope,
  FaGlobe,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQrcode,
  FaShareAlt,
  FaStore,
  FaWhatsapp,
} from "react-icons/fa";

import EntityImage from "../../components/EntityImage";
import GlobalCard from "../../components/GlobalCard";
import GlobalGallery from "../../components/GlobalGallery";
import GlobalMap from "../../components/GlobalMap";
import GlobalNav from "../../components/GlobalNav";
import LocalQrCode from "../../components/LocalQrCode";
import NexusFeedback from "../../components/NexusFeedback";
import ProcessingIndicatorComponent from "../../components/ProcessingIndicatorComponent";
import useEstablishmentItemsByIdentifier from "../../hooks/useEstablishmentItemsByIdentifier";
import useImageUtils from "../../hooks/useImageUtils";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { linkApp } from "../../config";
import "./EstablishmentView.css";

const fmtBRL = (value) =>
  `R$ ${Number(value || 0).toFixed(2).replace(".", ",")}`;

const ensureExternalUrl = (value) => {
  if (!value) return null;
  const trimmed = String(value).trim();
  if (!trimmed) return null;
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

const setMeta = (name, content, property = false) => {
  if (!content) return;
  const selector = property
    ? `meta[property="${name}"]`
    : `meta[name="${name}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(property ? "property" : "name", name);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

export default function EstablishmentViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, items, loading, apiError } =
    useEstablishmentItemsByIdentifier(slug);
  const { imageUrl } = useImageUtils();
  const whatsappLink = useWhatsappLink(establishment);

  const activeItems = useMemo(
    () => items.filter((item) => Number(item.status ?? 1) !== 0),
    [items]
  );

  const title = establishment?.fantasy || establishment?.name || "Empresa";
  const companyUrl = `${linkApp}/establishment/view/${encodeURIComponent(
    slug || ""
  )}`;
  const catalogUrl = `/catalog/${encodeURIComponent(slug || "")}`;
  const websiteUrl = ensureExternalUrl(
    establishment?.website || establishment?.site || establishment?.url
  );
  const gallery = Array.isArray(establishment?.images?.gallery)
    ? establishment.images.gallery
    : [];
  const cover =
    establishment?.images?.background ||
    establishment?.images?.cover ||
    establishment?.background ||
    establishment?.cover ||
    establishment?.banner ||
    null;
  const resolvedCover = cover ? imageUrl(cover) : null;
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  const logoCandidates = [
    establishment?.images?.logo,
    establishment?.logo,
    files.find((file) => file?.type === "logo")?.public_url,
    files.find((file) => file?.is_primary)?.public_url,
  ];
  const socialImage = cover || logoCandidates.find(Boolean) || null;
  const featuredItems = activeItems.slice(0, 6);
  const locationLabel = [establishment?.city, establishment?.uf]
    .filter(Boolean)
    .join(" - ");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    if (!establishment) return undefined;

    const previousTitle = document.title;
    const description =
      establishment.description ||
      `Conheça ${title}, veja informações, localização e catálogo na Nexus.`;

    document.title = `${title} — Nexus`;
    setMeta("description", description);
    setMeta("og:title", `${title} — Nexus`, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "business.business", true);
    setMeta("og:url", companyUrl, true);
    if (socialImage) setMeta("og:image", imageUrl(socialImage), true);
    setMeta("twitter:card", socialImage ? "summary_large_image" : "summary");
    setMeta("twitter:title", `${title} — Nexus`);
    setMeta("twitter:description", description);
    if (socialImage) setMeta("twitter:image", imageUrl(socialImage));

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", companyUrl);

    return () => {
      document.title = previousTitle;
    };
  }, [companyUrl, establishment, imageUrl, socialImage, title]);

  const shareCompany = async () => {
    const shareData = {
      title,
      text: `Conheça ${title} na Nexus.`,
      url: companyUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    try {
      await navigator.clipboard.writeText(companyUrl);
    } catch {
      window.prompt("Copie o link da empresa:", companyUrl);
    }
  };

  if (loading) {
    return (
      <ProcessingIndicatorComponent
        messages={["Carregando empresa…", "Preparando a apresentação…"]}
      />
    );
  }

  if (apiError || !establishment) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5">
          <NexusFeedback
            type="error"
            title="Empresa indisponível"
            actionLabel="Ir para a Nexus"
            onAction={() => navigate("/")}
          >
            {apiError ||
              "Não encontramos esta empresa. O link pode estar incorreto ou a empresa pode não estar mais disponível."}
          </NexusFeedback>
        </Container>
      </>
    );
  }

  return (
    <div className="estv-root">
      <GlobalNav />

      <header
        className={`estv-presentation-hero${resolvedCover ? " has-cover" : ""}`}
        style={
          resolvedCover ? { backgroundImage: `url(${resolvedCover})` } : undefined
        }
      >
        <div className="estv-presentation-overlay" />
        <Container className="estv-presentation-container">
          <div className="estv-brand-row">
            <EntityImage
              src={logoCandidates}
              name={title}
              alt={`Logo de ${title}`}
              shape="establishment"
              className="estv-brand-logo"
              loading="eager"
            />
            <div className="estv-brand-copy">
              <Badge className="estv-profile-badge">
                <FaStore /> Perfil da empresa
              </Badge>
              <h1>{title}</h1>
              {establishment.description && (
                <p>{establishment.description}</p>
              )}
              <div className="estv-hero-meta">
                {locationLabel && (
                  <span>
                    <FaMapMarkerAlt /> {locationLabel}
                  </span>
                )}
                {activeItems.length > 0 && (
                  <span>
                    <FaBoxOpen /> {activeItems.length}{" "}
                    {activeItems.length === 1 ? "item" : "itens"}
                  </span>
                )}
              </div>
              <div className="estv-hero-actions">
                <Button onClick={() => navigate(catalogUrl)}>
                  Ver catálogo <FaArrowRight />
                </Button>
                {whatsappLink && (
                  <a
                    className="estv-action estv-action--whatsapp"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <FaWhatsapp /> WhatsApp
                  </a>
                )}
                <button
                  type="button"
                  className="estv-action estv-action--ghost"
                  onClick={shareCompany}
                >
                  <FaShareAlt /> Compartilhar
                </button>
              </div>
            </div>
          </div>
        </Container>
      </header>

      <main className="estv-main">
        <Container>
          <Row className="g-4">
            <Col lg={8}>
              <section className="estv-section estv-about-card">
                <div className="estv-section-heading">
                  <span>Apresentação</span>
                  <h2>Sobre {title}</h2>
                </div>
                <p className="estv-about-text">
                  {establishment.description ||
                    `${title} faz parte da Nexus. Explore as informações da empresa e acesse o catálogo para conhecer seus produtos e serviços.`}
                </p>

                <div className="estv-contact-grid">
                  {establishment.phone && (
                    <div className="estv-contact-item">
                      <FaPhoneAlt />
                      <div>
                        <small>Telefone</small>
                        <strong>{establishment.phone}</strong>
                      </div>
                    </div>
                  )}
                  {establishment.email && (
                    <a
                      className="estv-contact-item"
                      href={`mailto:${establishment.email}`}
                    >
                      <FaEnvelope />
                      <div>
                        <small>E-mail</small>
                        <strong>{establishment.email}</strong>
                      </div>
                    </a>
                  )}
                  {locationLabel && (
                    <div className="estv-contact-item">
                      <FaMapMarkerAlt />
                      <div>
                        <small>Localização</small>
                        <strong>{locationLabel}</strong>
                      </div>
                    </div>
                  )}
                  {websiteUrl && (
                    <a
                      className="estv-contact-item"
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <FaGlobe />
                      <div>
                        <small>Site</small>
                        <strong>Visitar site</strong>
                      </div>
                    </a>
                  )}
                </div>
              </section>

              {gallery.length > 0 && (
                <section className="estv-section">
                  <div className="estv-section-heading">
                    <span>Ambiente e identidade</span>
                    <h2>Galeria da empresa</h2>
                  </div>
                  <GlobalGallery images={gallery} />
                </section>
              )}

              {featuredItems.length > 0 && (
                <section className="estv-section">
                  <div className="estv-section-heading estv-section-heading--inline">
                    <div>
                      <span>Destaques</span>
                      <h2>Produtos e serviços</h2>
                    </div>
                    <Button
                      variant="outline-info"
                      onClick={() => navigate(catalogUrl)}
                    >
                      Ver catálogo completo <FaArrowRight />
                    </Button>
                  </div>
                  <Row className="g-3">
                    {featuredItems.map((item) => (
                      <Col key={item.id} xs={12} md={6} xl={4}>
                        <GlobalCard
                          item={item}
                          fmtBRL={fmtBRL}
                          navigate={navigate}
                        />
                      </Col>
                    ))}
                  </Row>
                </section>
              )}

              <GlobalMap
                location={establishment.location}
                address={establishment.address}
                city={establishment.city}
                uf={establishment.uf}
              />
            </Col>

            <Col lg={4}>
              <aside className="estv-side-stack">
                <section className="estv-side-card estv-qr-card">
                  <div className="estv-side-icon">
                    <FaQrcode />
                  </div>
                  <h2>Acesse esta empresa rapidamente</h2>
                  <p>
                    O QR Code abre diretamente esta apresentação pública, sem
                    exigir que a pessoa procure a empresa manualmente.
                  </p>
                  <LocalQrCode value={companyUrl} title={title} />
                  <button type="button" onClick={shareCompany}>
                    <FaShareAlt /> Compartilhar empresa
                  </button>
                </section>

                <section className="estv-side-card estv-catalog-card">
                  <span>Catálogo Nexus</span>
                  <h2>Veja tudo que {title} oferece</h2>
                  <p>
                    Navegue pelos itens, filtre por categoria e abra os detalhes
                    de cada produto ou serviço.
                  </p>
                  <Button onClick={() => navigate(catalogUrl)}>
                    Abrir catálogo <FaArrowRight />
                  </Button>
                </section>
              </aside>
            </Col>
          </Row>
        </Container>
      </main>

      {whatsappLink && (
        <a
          href={whatsappLink}
          target="_blank"
          rel="noreferrer"
          className="estv-whatsapp-fab"
          title="Chamar no WhatsApp"
          aria-label={`Chamar ${title} no WhatsApp`}
        >
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
