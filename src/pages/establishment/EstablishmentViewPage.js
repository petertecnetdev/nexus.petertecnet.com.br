// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { Badge, Button, Col, Container, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCheckCircle,
  FaCompass,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQrcode,
  FaShareAlt,
  FaStore,
  FaWhatsapp,
  FaYoutube,
} from "react-icons/fa";

import EntityImage from "../../components/EntityImage";
import EstablishmentDiscoveryLinks from "../../components/establishment/EstablishmentDiscoveryLinks";
import GlobalCard from "../../components/GlobalCard";
import GlobalFooter from "../../components/GlobalFooter";
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

const parseList = (value) => {
  if (Array.isArray(value)) return value.filter(Boolean);
  if (!value || typeof value !== "string") return [];

  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) return parsed.filter(Boolean);
  } catch {
    // Fall through to comma-separated values.
  }

  return value
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
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
  const [coverReady, setCoverReady] = useState(false);

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
    establishment?.website_url ||
      establishment?.website ||
      establishment?.site ||
      establishment?.url
  );
  const gallery = Array.isArray(establishment?.images?.gallery)
    ? establishment.images.gallery
    : [];
  const cover =
    establishment?.images?.background ||
    establishment?.images?.background_url ||
    establishment?.images?.cover ||
    establishment?.images?.cover_url ||
    establishment?.background ||
    establishment?.background_url ||
    establishment?.background_image ||
    establishment?.cover ||
    establishment?.cover_url ||
    establishment?.banner ||
    null;
  const resolvedCover = cover ? imageUrl(cover) : null;
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  const logoCandidates = [
    establishment?.images?.logo,
    establishment?.images?.logo_url,
    establishment?.logo,
    establishment?.logo_url,
    files.find((file) =>
      String(file?.type || file?.role || "")
        .toLowerCase()
        .includes("logo")
    )?.public_url,
    files.find((file) => file?.is_primary)?.public_url,
  ];
  const socialImage = cover || logoCandidates.find(Boolean) || null;
  const featuredItems = activeItems.slice(0, 6);
  const locationLabel = [establishment?.city, establishment?.uf]
    .filter(Boolean)
    .join(" - ");
  const addressLabel = [
    establishment?.address,
    establishment?.city,
    establishment?.uf,
    establishment?.cep ? `CEP ${establishment.cep}` : null,
  ]
    .filter(Boolean)
    .join(" · ");
  const segments = parseList(establishment?.segments).slice(0, 5);
  const additionalInfo =
    establishment?.additional_info ||
    establishment?.additional_information ||
    establishment?.details ||
    null;

  const socialLinks = [
    {
      label: "Instagram",
      icon: FaInstagram,
      href: ensureExternalUrl(
        establishment?.instagram_url || establishment?.instagram
      ),
    },
    {
      label: "Facebook",
      icon: FaFacebookF,
      href: ensureExternalUrl(
        establishment?.facebook_url || establishment?.facebook
      ),
    },
    {
      label: "YouTube",
      icon: FaYoutube,
      href: ensureExternalUrl(
        establishment?.youtube_url || establishment?.youtube
      ),
    },
  ].filter((social) => social.href);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    if (!resolvedCover) {
      setCoverReady(false);
      return undefined;
    }

    let active = true;
    const preload = new Image();
    preload.onload = () => {
      if (active) setCoverReady(true);
    };
    preload.onerror = () => {
      if (active) setCoverReady(false);
    };
    preload.src = resolvedCover;

    return () => {
      active = false;
    };
  }, [resolvedCover]);

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
        <GlobalFooter />
      </>
    );
  }

  return (
    <div className="estv-root">
      <GlobalNav />

      <header
        className={`estv-presentation-hero${coverReady ? " has-cover" : ""}`}
        style={
          coverReady
            ? {
                backgroundImage: `linear-gradient(180deg, rgba(3, 10, 20, .05), rgba(3, 10, 20, .24)), url("${resolvedCover}")`,
              }
            : undefined
        }
      >
        <div className="estv-presentation-overlay" />
        <Container className="estv-presentation-container">
          <nav className="estv-breadcrumbs" aria-label="Navegação da empresa">
            <button type="button" onClick={() => navigate("/")}>
              Nexus
            </button>
            <span>/</span>
            <button type="button" onClick={() => navigate("/")}>
              Empresas
            </button>
            <span>/</span>
            <strong>{title}</strong>
          </nav>

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
              <div className="estv-hero-kickers">
                <Badge className="estv-profile-badge">
                  <FaStore /> Perfil da empresa
                </Badge>
                <span className="estv-live-badge">
                  <FaCheckCircle /> Catálogo disponível
                </span>
              </div>
              <h1>{title}</h1>
              {establishment.description && (
                <p>{establishment.description}</p>
              )}

              {segments.length > 0 && (
                <div className="estv-segment-list" aria-label="Segmentos">
                  {segments.map((segment) => (
                    <span key={segment}>{segment}</span>
                  ))}
                </div>
              )}

              <div className="estv-hero-meta">
                {locationLabel && (
                  <span>
                    <FaMapMarkerAlt /> {locationLabel}
                  </span>
                )}
                <span>
                  <FaBoxOpen /> {activeItems.length}{" "}
                  {activeItems.length === 1 ? "item disponível" : "itens disponíveis"}
                </span>
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
                <button
                  type="button"
                  className="estv-action estv-action--ghost"
                  onClick={() => navigate("/")}
                >
                  <FaCompass /> Explorar Nexus
                </button>
              </div>
            </div>
          </div>
        </Container>
      </header>

      <main className="estv-main">
        <Container>
          <section className="estv-overview-strip" aria-label="Resumo da empresa">
            <div>
              <span>Catálogo</span>
              <strong>{activeItems.length} itens</strong>
              <small>Produtos e serviços ativos</small>
            </div>
            <div>
              <span>Localização</span>
              <strong>{locationLabel || "Não informada"}</strong>
              <small>{establishment?.address || "Consulte os dados da empresa"}</small>
            </div>
            <div>
              <span>Contato rápido</span>
              <strong>
                {whatsappLink
                  ? "WhatsApp disponível"
                  : establishment?.phone || "Dados no perfil"}
              </strong>
              <small>Acesso direto pelos canais cadastrados</small>
            </div>
          </section>

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
                    <a
                      className="estv-contact-item"
                      href={`tel:${String(establishment.phone).replace(/\s+/g, "")}`}
                    >
                      <FaPhoneAlt />
                      <div>
                        <small>Telefone</small>
                        <strong>{establishment.phone}</strong>
                      </div>
                    </a>
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
                  {addressLabel && (
                    <div className="estv-contact-item">
                      <FaMapMarkerAlt />
                      <div>
                        <small>Endereço</small>
                        <strong>{addressLabel}</strong>
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
                        <strong>Visitar site oficial</strong>
                      </div>
                    </a>
                  )}
                </div>

                {socialLinks.length > 0 && (
                  <div className="estv-social-links" aria-label="Redes sociais">
                    {socialLinks.map(({ label, icon: Icon, href }) => (
                      <a key={label} href={href} target="_blank" rel="noreferrer">
                        <Icon /> {label}
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {additionalInfo && (
                <section className="estv-section estv-info-card">
                  <div className="estv-section-heading">
                    <span>Informações úteis</span>
                    <h2>Antes de visitar ou comprar</h2>
                  </div>
                  <p>{additionalInfo}</p>
                </section>
              )}

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
                <section className="estv-section estv-featured-section">
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

                <section className="estv-side-card estv-explore-card">
                  <div className="estv-side-icon">
                    <FaCompass />
                  </div>
                  <h2>Continue descobrindo</h2>
                  <p>
                    Conheça outros estabelecimentos e itens disponíveis na Nexus.
                  </p>
                  <button type="button" onClick={() => navigate("/")}>
                    Explorar empresas e itens <FaArrowRight />
                  </button>
                </section>
              </aside>
            </Col>
          </Row>

          <EstablishmentDiscoveryLinks establishment={establishment} />
        </Container>
      </main>

      <GlobalFooter />

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
