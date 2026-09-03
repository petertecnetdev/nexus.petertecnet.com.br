// src/pages/establishment/EstablishmentViewPage.jsx
import React, { useEffect, useMemo } from "react";
import { Badge, Button, Col, Container, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import Swal from "sweetalert2";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCalendarCheck,
  FaCheckCircle,
  FaClipboardList,
  FaCopy,
  FaCreditCard,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQrcode,
  FaShareAlt,
  FaShoppingCart,
  FaStore,
  FaTwitter,
  FaWhatsapp,
  FaYoutube,
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
import { apiV1BaseUrl, linkApp } from "../../config";
import { trackTelemetry } from "../../telemetry";
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

const WEEK_DAYS = [
  ["monday", "Segunda"],
  ["tuesday", "Terça"],
  ["wednesday", "Quarta"],
  ["thursday", "Quinta"],
  ["friday", "Sexta"],
  ["saturday", "Sábado"],
  ["sunday", "Domingo"],
];

const PAYMENT_LABELS = {
  pix: "Pix",
  credit_card: "Cartão de crédito",
  debit_card: "Cartão de débito",
  cash: "Dinheiro",
  bank_transfer: "Transferência",
  payment_link: "Link de pagamento",
};

const CTA_CONFIG = {
  catalog: { label: "Ver catálogo", icon: FaArrowRight, action: "catalog" },
  buy: { label: "Comprar agora", icon: FaShoppingCart, action: "catalog" },
  schedule: { label: "Agendar", icon: FaCalendarCheck, action: "contact" },
  quote: { label: "Pedir orçamento", icon: FaClipboardList, action: "contact" },
  contact: { label: "Entrar em contato", icon: FaWhatsapp, action: "contact" },
};

const entityMetadata = (establishment) => ({
  entity_type: "establishment",
  entity_id: establishment?.id,
  entity_slug: establishment?.slug,
});

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
  const shareUrl = `${apiV1BaseUrl}/directory/share/establishment/${encodeURIComponent(
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
  const profile = establishment?.profile_settings || {};
  const coverPositionY = Math.min(
    100,
    Math.max(0, Number(profile.cover_position_y ?? 50))
  );
  const capabilities = Array.isArray(profile.capabilities)
    ? profile.capabilities
    : [];
  const paymentMethods = Array.isArray(profile.payment_methods)
    ? profile.payment_methods
    : [];
  const businessHours = profile.business_hours || {};
  const preferredCta =
    profile.primary_cta ||
    (capabilities.includes("commerce")
      ? "buy"
      : capabilities.includes("scheduling")
      ? "schedule"
      : capabilities.includes("quotes")
      ? "quote"
      : whatsappLink
      ? "contact"
      : "catalog");
  const cta = CTA_CONFIG[preferredCta] || CTA_CONFIG.catalog;
  const PrimaryCtaIcon = cta.icon;
  const featuredItems = useMemo(() => {
    const featured = activeItems
      .filter((item) => item.is_featured)
      .sort(
        (a, b) =>
          Number(a.display_order || 0) - Number(b.display_order || 0) ||
          String(a.name || "").localeCompare(String(b.name || ""), "pt-BR")
      );
    return (featured.length ? featured : activeItems).slice(0, 6);
  }, [activeItems]);
  const locationLabel = [establishment?.city, establishment?.uf]
    .filter(Boolean)
    .join(" - ");
  const fullAddress = [
    establishment?.address,
    establishment?.city,
    establishment?.uf,
    establishment?.cep,
  ]
    .filter(Boolean)
    .join(" · ");
  const socialLinks = [
    ["Instagram", ensureExternalUrl(establishment?.instagram_url), FaInstagram],
    ["Facebook", ensureExternalUrl(establishment?.facebook_url), FaFacebookF],
    ["X / Twitter", ensureExternalUrl(establishment?.twitter_url), FaTwitter],
    ["YouTube", ensureExternalUrl(establishment?.youtube_url), FaYoutube],
  ].filter(([, url]) => Boolean(url));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    if (!establishment?.id) return;
    trackTelemetry("company_profile_view", {
      label: title,
      target: companyUrl,
      metadata: entityMetadata(establishment),
    });
  }, [companyUrl, establishment, title]);

  useEffect(() => {
    if (!establishment || window.location.hash !== "#qrcode") return;
    window.setTimeout(() => {
      document.getElementById("qrcode")?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }, 100);
  }, [establishment]);

  useEffect(() => {
    if (!establishment) return undefined;

    const previousTitle = document.title;
    const description =
      establishment.description ||
      `Conheça ${title}, veja informações, localização e catálogo na Nexus.`;

    document.title = `${title} — Nexus`;
    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large");
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

    const jsonLd = document.createElement("script");
    jsonLd.type = "application/ld+json";
    jsonLd.dataset.nexusEntitySeo = "establishment";
    jsonLd.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "LocalBusiness",
      name: title,
      description,
      url: companyUrl,
      image: socialImage ? imageUrl(socialImage) : undefined,
      telephone: establishment.phone || undefined,
      email: establishment.email || undefined,
      address: fullAddress
        ? {
            "@type": "PostalAddress",
            streetAddress: establishment.address || undefined,
            addressLocality: establishment.city || undefined,
            addressRegion: establishment.uf || undefined,
            postalCode: establishment.cep || undefined,
            addressCountry: "BR",
          }
        : undefined,
      sameAs: socialLinks.map(([, url]) => url),
    });
    document.head
      .querySelector('script[data-nexus-entity-seo="establishment"]')
      ?.remove();
    document.head.appendChild(jsonLd);

    return () => {
      document.title = previousTitle;
      jsonLd.remove();
    };
  }, [
    companyUrl,
    establishment,
    fullAddress,
    imageUrl,
    socialImage,
    socialLinks,
    title,
  ]);

  const notifyCopied = () =>
    Swal.fire({
      toast: true,
      position: "bottom-end",
      icon: "success",
      title: "Link copiado",
      showConfirmButton: false,
      timer: 1800,
      timerProgressBar: true,
    });

  const copyCompanyLink = async () => {
    try {
      await navigator.clipboard.writeText(companyUrl);
      notifyCopied();
      trackTelemetry("share", {
        label: title,
        target: companyUrl,
        metadata: { ...entityMetadata(establishment), channel: "clipboard" },
      });
    } catch {
      window.prompt("Copie o link da empresa:", companyUrl);
    }
  };

  const shareCompany = async () => {
    const shareData = {
      title,
      text: `Conheça ${title} na Nexus.`,
      url: shareUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        trackTelemetry("share", {
          label: title,
          target: shareUrl,
          metadata: { ...entityMetadata(establishment), channel: "native" },
        });
        return;
      } catch (error) {
        if (error?.name === "AbortError") return;
      }
    }

    await copyCompanyLink();
  };

  const openCatalog = () => {
    trackTelemetry("catalog_open", {
      label: title,
      target: catalogUrl,
      metadata: entityMetadata(establishment),
    });
    navigate(catalogUrl);
  };

  const trackContact = (channel = "whatsapp") => {
    trackTelemetry("contact_click", {
      label: title,
      target: channel,
      metadata: { ...entityMetadata(establishment), channel },
    });
  };

  const handlePrimaryCta = () => {
    if (cta.action === "contact" && whatsappLink) {
      trackContact(preferredCta);
      window.open(whatsappLink, "_blank", "noopener,noreferrer");
      return;
    }
    openCatalog();
  };

  const trackExternal = (channel, target) => {
    trackTelemetry("external_link_click", {
      label: `${title} · ${channel}`,
      target,
      metadata: { ...entityMetadata(establishment), channel },
    });
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
          resolvedCover
            ? {
                backgroundImage: `url(${resolvedCover})`,
                backgroundPosition: `center ${coverPositionY}%`,
              }
            : undefined
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
              <div className="estv-badge-row">
                <Badge className="estv-profile-badge">
                  <FaStore /> Perfil da empresa
                </Badge>
                {Boolean(establishment.is_approved) && (
                  <Badge className="estv-verified-badge">
                    <FaCheckCircle /> Empresa verificada
                  </Badge>
                )}
              </div>
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
                {establishment.category && (
                  <span>
                    <FaStore /> {establishment.category}
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
                <Button onClick={handlePrimaryCta}>
                  <PrimaryCtaIcon /> {cta.label}
                </Button>
                {whatsappLink && preferredCta !== "contact" && (
                  <a
                    className="estv-action estv-action--whatsapp"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackContact("whatsapp")}
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
                  <span>Informações</span>
                  <h2>Conheça {title}</h2>
                </div>
                <p className="estv-about-text">
                  {establishment.additional_info ||
                    `${title}${locationLabel ? ` atende em ${locationLabel}` : ""}. Veja abaixo os canais de contato, localização e os principais produtos e serviços disponíveis.`}
                </p>

                {Array.isArray(establishment.segments) &&
                  establishment.segments.length > 0 && (
                    <div className="estv-chip-row" aria-label="Segmentos da empresa">
                      {establishment.segments.map((segment) => (
                        <span key={segment}>{segment}</span>
                      ))}
                    </div>
                  )}

                <div className="estv-contact-grid">
                  {establishment.phone && (
                    <a
                      className="estv-contact-item"
                      href={`tel:${establishment.phone}`}
                      onClick={() => trackContact("phone")}
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
                      onClick={() => trackContact("email")}
                    >
                      <FaEnvelope />
                      <div>
                        <small>E-mail</small>
                        <strong>{establishment.email}</strong>
                      </div>
                    </a>
                  )}
                  {fullAddress && (
                    <div className="estv-contact-item">
                      <FaMapMarkerAlt />
                      <div>
                        <small>Endereço</small>
                        <strong>{fullAddress}</strong>
                      </div>
                    </div>
                  )}
                  {websiteUrl && (
                    <a
                      className="estv-contact-item"
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackExternal("website", websiteUrl)}
                    >
                      <FaGlobe />
                      <div>
                        <small>Site</small>
                        <strong>Visitar site</strong>
                      </div>
                    </a>
                  )}
                </div>

                {socialLinks.length > 0 && (
                  <div className="estv-social-row" aria-label="Redes sociais">
                    {socialLinks.map(([label, url, Icon]) => (
                      <a
                        key={label}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`${label} de ${title}`}
                        onClick={() => trackExternal(label.toLowerCase(), url)}
                      >
                        <Icon /> <span>{label}</span>
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {(Object.keys(businessHours).length > 0 || paymentMethods.length > 0) && (
                <section className="estv-section estv-service-info">
                  <div className="estv-section-heading">
                    <span>Atendimento</span>
                    <h2>Como comprar ou falar com a empresa</h2>
                  </div>
                  <div className="estv-service-grid">
                    {Object.keys(businessHours).length > 0 && (
                      <div className="estv-info-panel">
                        <h3>Horários</h3>
                        <div className="estv-hours-list">
                          {WEEK_DAYS.map(([key, label]) => {
                            const entry = businessHours[key];
                            if (!entry) return null;
                            return (
                              <div key={key}>
                                <span>{label}</span>
                                <strong>
                                  {entry.enabled === false
                                    ? "Fechado"
                                    : entry.open && entry.close
                                    ? `${entry.open}–${entry.close}`
                                    : "Consulte"}
                                </strong>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {paymentMethods.length > 0 && (
                      <div className="estv-info-panel">
                        <h3><FaCreditCard /> Formas de pagamento</h3>
                        <div className="estv-chip-row">
                          {paymentMethods.map((method) => (
                            <span key={method}>{PAYMENT_LABELS[method] || method}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
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
                <section className="estv-section">
                  <div className="estv-section-heading estv-section-heading--inline">
                    <div>
                      <span>{featuredItems.some((item) => item.is_featured) ? "Destaques escolhidos" : "Destaques"}</span>
                      <h2>Produtos e serviços</h2>
                    </div>
                    <Button variant="outline-info" onClick={openCatalog}>
                      Ver catálogo completo <FaArrowRight />
                    </Button>
                  </div>
                  <Row className="g-3">
                    {featuredItems.map((item) => (
                      <Col
                        key={item.id}
                        xs={12}
                        md={6}
                        xl={4}
                        onClickCapture={() =>
                          trackTelemetry("item_open", {
                            label: item.name,
                            target: item.slug || item.id,
                            metadata: {
                              entity_type: "item",
                              entity_id: item.id,
                              entity_slug: item.slug,
                              establishment_id: establishment.id,
                            },
                          })
                        }
                      >
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
                <section id="qrcode" className="estv-side-card estv-qr-card" tabIndex="-1">
                  <div className="estv-side-icon">
                    <FaQrcode />
                  </div>
                  <h2>Acesse esta empresa rapidamente</h2>
                  <p>
                    O QR Code abre diretamente esta apresentação pública, sem
                    exigir que a pessoa procure a empresa manualmente.
                  </p>
                  <LocalQrCode
                    value={companyUrl}
                    title={title}
                    onDownload={() =>
                      trackTelemetry("qr_action", {
                        label: title,
                        target: companyUrl,
                        metadata: {
                          ...entityMetadata(establishment),
                          action: "download",
                        },
                      })
                    }
                  />
                  <div className="estv-share-buttons">
                    <button type="button" onClick={shareCompany}>
                      <FaShareAlt /> Compartilhar
                    </button>
                    <button type="button" onClick={copyCompanyLink}>
                      <FaCopy /> Copiar link
                    </button>
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Conheça ${title} na Nexus: ${shareUrl}`)}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() =>
                        trackTelemetry("share", {
                          label: title,
                          target: shareUrl,
                          metadata: {
                            ...entityMetadata(establishment),
                            channel: "whatsapp",
                          },
                        })
                      }
                    >
                      <FaWhatsapp /> Enviar
                    </a>
                  </div>
                </section>

                <section className="estv-side-card estv-catalog-card">
                  <span>Catálogo Nexus</span>
                  <h2>Veja tudo que {title} oferece</h2>
                  <p>
                    Navegue pelos itens, filtre por categoria e abra os detalhes
                    de cada produto ou serviço.
                  </p>
                  <Button onClick={openCatalog}>
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
          onClick={() => trackContact("whatsapp_fab")}
        >
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}
    </div>
  );
}
