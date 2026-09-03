import React, { useEffect, useMemo, useRef, useState } from "react";
import { Badge, Button, Col, Container, Form, Modal, Row } from "react-bootstrap";
import { useNavigate, useParams } from "react-router-dom";
import {
  FaArrowRight,
  FaBoxOpen,
  FaCar,
  FaCheckCircle,
  FaClock,
  FaCompass,
  FaCreditCard,
  FaEnvelope,
  FaFacebookF,
  FaGlobe,
  FaInstagram,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaQrcode,
  FaSearch,
  FaShareAlt,
  FaShoppingBag,
  FaStore,
  FaTimes,
  FaTruck,
  FaUniversalAccess,
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
import { trackExperienceEvent } from "../../services/experienceTelemetry";
import {
  buildStructuredData,
  filterAndRankItems,
  getBusinessProfile,
  getCommerceFacts,
  getItemCategories,
  getOpeningStatus,
  parseList,
} from "../../utils/establishmentExperience";
import "./EstablishmentView.css";
import "./EstablishmentExperience.css";

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

const weekdayOrder = [
  ["sunday", "domingo", "dom", "0"],
  ["monday", "segunda", "seg", "1"],
  ["tuesday", "terca", "terça", "ter", "2"],
  ["wednesday", "quarta", "qua", "3"],
  ["thursday", "quinta", "qui", "4"],
  ["friday", "sexta", "sex", "5"],
  ["saturday", "sabado", "sábado", "sab", "6"],
];

const weekdayLabels = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
];

const formatHours = (entry) => {
  if (entry === false || entry === null) return "Fechado";
  if (Array.isArray(entry)) return formatHours(entry[0]);
  if (typeof entry === "string") return entry;
  if (!entry || typeof entry !== "object") return null;
  if (entry.closed || entry.is_closed) return "Fechado";
  if (entry.open_24_hours || entry.open24 || entry.is_24h) return "24 horas";
  const open = entry.open || entry.opens || entry.start || entry.from;
  const close = entry.close || entry.closes || entry.end || entry.to;
  return open && close ? `${open} – ${close}` : null;
};

const scheduleRows = (profile) => {
  const hours = profile?.opening_hours || profile?.business_hours;
  if (!hours || typeof hours !== "object" || Array.isArray(hours)) return [];

  return weekdayOrder.flatMap((keys, index) => {
    const key = keys.find((candidate) =>
      Object.prototype.hasOwnProperty.call(hours, candidate)
    );
    if (!key) return [];
    const value = formatHours(hours[key]);
    return value ? [{ day: weekdayLabels[index], value }] : [];
  });
};

const scrollToElement = (id) => {
  const element = document.getElementById(id);
  if (!element) return;
  element.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function EstablishmentExperiencePage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { establishment, items, loading, apiError } =
    useEstablishmentItemsByIdentifier(slug);
  const { imageUrl } = useImageUtils();
  const whatsappLink = useWhatsappLink(establishment);
  const catalogRef = useRef(null);
  const trackedEstablishmentRef = useRef(null);
  const catalogSeenRef = useRef(false);

  const [coverReady, setCoverReady] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Todos");
  const [sort, setSort] = useState("smart");
  const [visibleLimit, setVisibleLimit] = useState(9);
  const [qrItem, setQrItem] = useState(null);
  const [now, setNow] = useState(() => new Date());

  const activeItems = useMemo(
    () => items.filter((item) => Number(item.status ?? 1) !== 0),
    [items]
  );
  const categories = useMemo(() => getItemCategories(activeItems), [activeItems]);
  const filteredItems = useMemo(
    () => filterAndRankItems(activeItems, { query, category, sort }),
    [activeItems, category, query, sort]
  );
  const visibleItems = filteredItems.slice(0, visibleLimit);

  const title = establishment?.fantasy || establishment?.name || "Empresa";
  const companyUrl = `${linkApp}/establishment/view/${encodeURIComponent(
    slug || ""
  )}`;
  const catalogPath = `/catalog/${encodeURIComponent(slug || "")}`;
  const catalogAbsoluteUrl = `${linkApp}${catalogPath}`;
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
  const segments = parseList(establishment?.segments).slice(0, 6);
  const additionalInfo =
    establishment?.additional_info ||
    establishment?.additional_information ||
    establishment?.details ||
    null;
  const businessProfile = getBusinessProfile(establishment);
  const commerceFacts = getCommerceFacts(establishment);
  const openingStatus = useMemo(
    () => getOpeningStatus(establishment, now),
    [establishment, now]
  );
  const openingRows = useMemo(
    () => scheduleRows(businessProfile),
    [businessProfile]
  );
  const totalViews = Number(
    establishment?.total_views ||
      establishment?.views_count ||
      establishment?.metrics?.total_views ||
      0
  );
  const isVerified = Boolean(
    establishment?.is_verified || businessProfile?.verified === true
  );

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

  const businessFacts = useMemo(() => {
    const facts = [];
    if (commerceFacts.paymentMethods.length) {
      facts.push({
        key: "payment",
        icon: FaCreditCard,
        label: "Pagamentos",
        value: commerceFacts.paymentMethods.join(" · "),
      });
    }
    if (commerceFacts.deliveryAvailable !== null) {
      facts.push({
        key: "delivery",
        icon: FaTruck,
        label: "Entrega",
        value: commerceFacts.deliveryAvailable ? "Disponível" : "Não informada como disponível",
      });
    }
    if (commerceFacts.pickupAvailable !== null) {
      facts.push({
        key: "pickup",
        icon: FaShoppingBag,
        label: "Retirada",
        value: commerceFacts.pickupAvailable ? "Disponível" : "Não informada como disponível",
      });
    }
    if (commerceFacts.serviceArea) {
      facts.push({
        key: "area",
        icon: FaMapMarkerAlt,
        label: "Área de atendimento",
        value: commerceFacts.serviceArea,
      });
    }
    if (commerceFacts.accessibility !== null) {
      facts.push({
        key: "accessibility",
        icon: FaUniversalAccess,
        label: "Acessibilidade",
        value: commerceFacts.accessibility ? "Informada" : "Não informada como disponível",
      });
    }
    if (commerceFacts.parking !== null) {
      facts.push({
        key: "parking",
        icon: FaCar,
        label: "Estacionamento",
        value: commerceFacts.parking ? "Disponível" : "Não informado como disponível",
      });
    }
    if (establishment?.cnpj) {
      facts.push({
        key: "cnpj",
        icon: FaStore,
        label: "CNPJ",
        value: establishment.cnpj,
      });
    }
    return facts;
  }, [commerceFacts, establishment?.cnpj]);

  const structuredData = useMemo(() => {
    if (!establishment) return null;
    return buildStructuredData({
      establishment,
      items: activeItems.map((item) => ({
        ...item,
        image: item?.image ? imageUrl(item.image) : item?.image_url ? imageUrl(item.image_url) : undefined,
      })),
      companyUrl,
      catalogUrl: catalogAbsoluteUrl,
      title,
      imageUrl: socialImage ? imageUrl(socialImage) : undefined,
      socialLinks,
    });
  }, [
    activeItems,
    catalogAbsoluteUrl,
    companyUrl,
    establishment,
    imageUrl,
    socialImage,
    socialLinks,
    title,
  ]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    const interval = window.setInterval(() => setNow(new Date()), 60000);
    return () => window.clearInterval(interval);
  }, []);

  useEffect(() => {
    setVisibleLimit(9);
  }, [category, query, sort]);

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

    const preloadLink = document.createElement("link");
    preloadLink.rel = "preload";
    preloadLink.as = "image";
    preloadLink.href = resolvedCover;
    preloadLink.dataset.establishmentCover = "true";
    document.head.appendChild(preloadLink);

    return () => {
      active = false;
      preloadLink.remove();
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

  useEffect(() => {
    if (!structuredData) return undefined;
    const id = "establishment-structured-data";
    let script = document.getElementById(id);
    if (!script) {
      script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = id;
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(structuredData);
    return () => {
      script?.remove();
    };
  }, [structuredData]);

  useEffect(() => {
    if (!establishment?.id || trackedEstablishmentRef.current === establishment.id) {
      return;
    }
    trackedEstablishmentRef.current = establishment.id;
    trackExperienceEvent("navigation", "Visualizou estabelecimento", "establishment_profile", {
      establishment_id: establishment.id,
      catalog_items: activeItems.length,
      has_cover: Boolean(resolvedCover),
    });
  }, [activeItems.length, establishment?.id, resolvedCover]);

  useEffect(() => {
    if (!query.trim()) return undefined;
    const timeout = window.setTimeout(() => {
      trackExperienceEvent("search", "Busca no catálogo", "establishment_catalog_search", {
        establishment_id: establishment?.id,
        query_length: query.trim().length,
        result_count: filteredItems.length,
      });
    }, 600);
    return () => window.clearTimeout(timeout);
  }, [establishment?.id, filteredItems.length, query]);

  useEffect(() => {
    if (!catalogRef.current || typeof IntersectionObserver === "undefined") {
      return undefined;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting) && !catalogSeenRef.current) {
          catalogSeenRef.current = true;
          trackExperienceEvent("scroll", "Visualizou catálogo", "catalog_section", {
            establishment_id: establishment?.id,
          });
        }
      },
      { threshold: 0.18 }
    );
    observer.observe(catalogRef.current);
    return () => observer.disconnect();
  }, [establishment?.id]);

  const trackAction = (label, target, metadata = {}) => {
    trackExperienceEvent("click", label, target, {
      establishment_id: establishment?.id,
      ...metadata,
    });
  };

  const openCatalog = () => {
    trackAction("Abrir catálogo completo", "catalog_full");
    navigate(catalogPath);
  };

  const focusCatalog = () => {
    trackAction("Ir para produtos e serviços", "catalog_section");
    scrollToElement("establishment-catalog");
  };

  const shareCompany = async () => {
    trackAction("Compartilhar estabelecimento", "share_company");
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

  const openWhatsapp = () => {
    trackAction("Abrir WhatsApp", "whatsapp");
  };

  const openLocation = () => {
    trackAction("Ver localização", "map");
    scrollToElement("establishment-map");
  };

  const selectCategory = (nextCategory) => {
    setCategory(nextCategory);
    trackExperienceEvent("filter", "Categoria do catálogo", "catalog_category", {
      establishment_id: establishment?.id,
      category: nextCategory,
    });
  };

  const selectSort = (event) => {
    const value = event.target.value;
    setSort(value);
    trackExperienceEvent("filter", "Ordenação do catálogo", "catalog_sort", {
      establishment_id: establishment?.id,
      sort: value,
    });
  };

  const openItemQr = (event, item) => {
    event.preventDefault();
    event.stopPropagation();
    setQrItem(item);
    trackAction("Abrir QR Code do item", "item_qr", { item_id: item?.id });
  };

  const resetCatalogFilters = () => {
    setQuery("");
    setCategory("Todos");
    setSort("smart");
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
    <div className="estv-root estx-root">
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
            <button type="button" onClick={() => navigate("/" )}>
              Nexus
            </button>
            <span>/</span>
            <button type="button" onClick={() => navigate("/" )}>
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
                <span className={`estx-live-status estx-live-status--${openingStatus.tone}`}>
                  <FaClock /> {openingStatus.label}
                </span>
                {isVerified && (
                  <span className="estv-live-badge">
                    <FaCheckCircle /> Estabelecimento verificado
                  </span>
                )}
              </div>

              <h1>{title}</h1>
              {establishment.description && <p>{establishment.description}</p>}

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
                {totalViews > 0 && (
                  <span>
                    <FaCompass /> {totalViews.toLocaleString("pt-BR")} visualizações
                  </span>
                )}
              </div>

              <div className="estv-hero-actions">
                <Button onClick={focusCatalog}>
                  Explorar catálogo <FaArrowRight />
                </Button>
                {whatsappLink && (
                  <a
                    className="estv-action estv-action--whatsapp"
                    href={whatsappLink}
                    target="_blank"
                    rel="noreferrer"
                    onClick={openWhatsapp}
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
                  onClick={() => {
                    trackAction("Explorar Nexus", "ecosystem_discovery");
                    navigate("/");
                  }}
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
          <section className="estv-overview-strip estx-overview-strip" aria-label="Resumo da empresa">
            <div>
              <span>Catálogo</span>
              <strong>{activeItems.length} itens</strong>
              <small>Produtos e serviços ativos</small>
            </div>
            <div className={`estx-overview-status estx-overview-status--${openingStatus.tone}`}>
              <span>Funcionamento</span>
              <strong>{openingStatus.label}</strong>
              <small>{openingStatus.detail}</small>
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
                      onClick={() => trackAction("Ligar para estabelecimento", "phone")}
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
                      onClick={() => trackAction("Enviar e-mail", "email")}
                    >
                      <FaEnvelope />
                      <div>
                        <small>E-mail</small>
                        <strong>{establishment.email}</strong>
                      </div>
                    </a>
                  )}
                  {addressLabel && (
                    <button
                      type="button"
                      className="estv-contact-item estx-contact-button"
                      onClick={openLocation}
                    >
                      <FaMapMarkerAlt />
                      <div>
                        <small>Endereço</small>
                        <strong>{addressLabel}</strong>
                      </div>
                    </button>
                  )}
                  {websiteUrl && (
                    <a
                      className="estv-contact-item"
                      href={websiteUrl}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => trackAction("Visitar site", "website")}
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
                      <a
                        key={label}
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() => trackAction(`Abrir ${label}`, "social", { network: label })}
                      >
                        <Icon /> {label}
                      </a>
                    ))}
                  </div>
                )}
              </section>

              {(businessFacts.length > 0 || openingRows.length > 0) && (
                <section className="estv-section estx-business-section">
                  <div className="estv-section-heading">
                    <span>Informações comerciais</span>
                    <h2>Planeje sua compra ou visita</h2>
                  </div>

                  {businessFacts.length > 0 && (
                    <div className="estx-business-facts">
                      {businessFacts.map(({ key, icon: Icon, label, value }) => (
                        <div className="estx-business-fact" key={key}>
                          <Icon />
                          <div>
                            <small>{label}</small>
                            <strong>{value}</strong>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {openingRows.length > 0 && (
                    <div className="estx-schedule">
                      <div className="estx-schedule-title">
                        <FaClock />
                        <div>
                          <strong>Horário de funcionamento</strong>
                          <span>{openingStatus.detail}</span>
                        </div>
                      </div>
                      <div className="estx-schedule-grid">
                        {openingRows.map((row) => (
                          <div key={row.day}>
                            <span>{row.day}</span>
                            <strong>{row.value}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              )}

              {additionalInfo && (
                <section className="estv-section estv-info-card">
                  <div className="estv-section-heading">
                    <span>Informações úteis</span>
                    <h2>Antes de visitar ou comprar</h2>
                  </div>
                  <p>{additionalInfo}</p>
                </section>
              )}

              <section
                className="estv-section estx-catalog-section"
                id="establishment-catalog"
                ref={catalogRef}
              >
                <div className="estv-section-heading estv-section-heading--inline estx-catalog-heading">
                  <div>
                    <span>Catálogo inteligente</span>
                    <h2>Produtos e serviços</h2>
                    <p>
                      Busque, filtre por categoria e encontre mais rápido o que precisa.
                    </p>
                  </div>
                  <Button variant="outline-info" onClick={openCatalog}>
                    Catálogo completo <FaArrowRight />
                  </Button>
                </div>

                <div className="estx-catalog-tools">
                  <label className="estx-search-box">
                    <FaSearch />
                    <input
                      type="search"
                      value={query}
                      onChange={(event) => setQuery(event.target.value)}
                      placeholder={`Buscar em ${title}`}
                      aria-label={`Buscar produtos e serviços de ${title}`}
                    />
                    {query && (
                      <button type="button" onClick={() => setQuery("")} aria-label="Limpar busca">
                        <FaTimes />
                      </button>
                    )}
                  </label>

                  <Form.Select
                    className="estx-sort-select"
                    value={sort}
                    onChange={selectSort}
                    aria-label="Ordenar catálogo"
                  >
                    <option value="smart">Mais relevantes</option>
                    <option value="popular">Mais procurados</option>
                    <option value="recent">Novidades</option>
                    <option value="price_asc">Menor preço</option>
                  </Form.Select>
                </div>

                {categories.length > 1 && (
                  <div className="estx-category-chips" aria-label="Categorias do catálogo">
                    {categories.map((itemCategory) => (
                      <button
                        type="button"
                        key={itemCategory}
                        className={itemCategory === category ? "is-active" : ""}
                        onClick={() => selectCategory(itemCategory)}
                        aria-pressed={itemCategory === category}
                      >
                        {itemCategory}
                      </button>
                    ))}
                  </div>
                )}

                <div className="estx-results-summary" aria-live="polite">
                  <strong>{filteredItems.length}</strong>{" "}
                  {filteredItems.length === 1 ? "resultado encontrado" : "resultados encontrados"}
                  {(query || category !== "Todos") && (
                    <button type="button" onClick={resetCatalogFilters}>
                      Limpar filtros
                    </button>
                  )}
                </div>

                {visibleItems.length > 0 ? (
                  <>
                    <Row className="g-3 estx-item-grid">
                      {visibleItems.map((item) => (
                        <Col key={item.id || item.slug} xs={12} md={6} xl={4}>
                          <div
                            className="estx-item-wrap"
                            onClickCapture={(event) => {
                              if (event.target.closest(".estx-item-qr")) return;
                              trackAction("Abrir item do catálogo", "catalog_item", {
                                item_id: item?.id,
                              });
                            }}
                          >
                            <GlobalCard
                              item={item}
                              fmtBRL={fmtBRL}
                              navigate={navigate}
                            />
                            <button
                              type="button"
                              className="estx-item-qr"
                              onClick={(event) => openItemQr(event, item)}
                              aria-label={`Abrir QR Code de ${item?.name || "item"}`}
                              title="QR Code deste item"
                            >
                              <FaQrcode />
                            </button>
                          </div>
                        </Col>
                      ))}
                    </Row>

                    {filteredItems.length > visibleLimit && (
                      <div className="estx-load-more">
                        <Button
                          variant="outline-info"
                          onClick={() => setVisibleLimit((current) => current + 9)}
                        >
                          Mostrar mais itens
                        </Button>
                      </div>
                    )}
                  </>
                ) : (
                  <div className="estx-catalog-empty">
                    <FaSearch />
                    <strong>Nenhum item encontrado com estes filtros.</strong>
                    <span>Tente outra busca ou volte para todas as categorias.</span>
                    <button type="button" onClick={resetCatalogFilters}>
                      Mostrar todos
                    </button>
                  </div>
                )}
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

              <div id="establishment-map" className="estx-map-anchor">
                <GlobalMap
                  location={establishment.location}
                  address={establishment.address}
                  city={establishment.city}
                  uf={establishment.uf}
                />
              </div>
            </Col>

            <Col lg={4}>
              <aside className="estv-side-stack">
                <section className={`estv-side-card estx-hours-card estx-hours-card--${openingStatus.tone}`}>
                  <div className="estv-side-icon">
                    <FaClock />
                  </div>
                  <span className="estx-side-eyebrow">Funcionamento</span>
                  <h2>{openingStatus.label}</h2>
                  <p>{openingStatus.detail}</p>
                  {openingRows.length > 0 && (
                    <button type="button" onClick={() => scrollToElement("business-hours") || scrollToElement("establishment-catalog")}>
                      Horários cadastrados <FaArrowRight />
                    </button>
                  )}
                </section>

                <section className="estv-side-card estv-qr-card">
                  <div className="estv-side-icon">
                    <FaQrcode />
                  </div>
                  <h2>Acesse esta empresa rapidamente</h2>
                  <p>
                    Compartilhe este QR Code para abrir a apresentação pública sem
                    precisar procurar a empresa manualmente.
                  </p>
                  <LocalQrCode value={companyUrl} title={title} />
                  <button type="button" onClick={shareCompany}>
                    <FaShareAlt /> Compartilhar empresa
                  </button>
                </section>

                <section className="estv-side-card estv-catalog-card">
                  <span>Catálogo Nexus</span>
                  <h2>Encontre o que precisa com menos passos</h2>
                  <p>
                    Use busca, categorias e ordenação inteligente ou abra o catálogo
                    completo quando quiser ver tudo.
                  </p>
                  <Button onClick={focusCatalog}>
                    Buscar neste estabelecimento <FaSearch />
                  </Button>
                </section>

                <section className="estv-side-card estv-explore-card">
                  <div className="estv-side-icon">
                    <FaCompass />
                  </div>
                  <h2>Continue descobrindo</h2>
                  <p>
                    A Nexus recomenda outras empresas e itens relacionados ao contexto
                    desta página.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      trackAction("Explorar empresas e itens", "ecosystem_discovery");
                      navigate("/");
                    }}
                  >
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
          onClick={openWhatsapp}
        >
          <FaWhatsapp className="estv-whatsapp-icon" />
        </a>
      )}

      <nav className="estx-mobile-bar" aria-label="Ações rápidas da empresa">
        <button type="button" onClick={focusCatalog}>
          <FaSearch />
          <span>Catálogo</span>
        </button>
        {whatsappLink ? (
          <a href={whatsappLink} target="_blank" rel="noreferrer" onClick={openWhatsapp}>
            <FaWhatsapp />
            <span>WhatsApp</span>
          </a>
        ) : establishment.phone ? (
          <a
            href={`tel:${String(establishment.phone).replace(/\s+/g, "")}`}
            onClick={() => trackAction("Ligar pelo mobile", "phone")}
          >
            <FaPhoneAlt />
            <span>Ligar</span>
          </a>
        ) : (
          <button type="button" onClick={openCatalog}>
            <FaBoxOpen />
            <span>Itens</span>
          </button>
        )}
        <button type="button" onClick={openLocation}>
          <FaMapMarkerAlt />
          <span>Localização</span>
        </button>
        <button type="button" onClick={shareCompany}>
          <FaShareAlt />
          <span>Compartilhar</span>
        </button>
      </nav>

      <Modal
        show={Boolean(qrItem)}
        onHide={() => setQrItem(null)}
        centered
        contentClassName="estx-qr-modal"
      >
        <Modal.Header closeButton closeVariant="white">
          <Modal.Title>QR Code do item</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {qrItem && (
            <>
              <div className="estx-qr-modal-copy">
                <EntityImage
                  src={[qrItem.image, qrItem.image_url]}
                  name={qrItem.name || "Item"}
                  alt={qrItem.name || "Item"}
                  loading="lazy"
                />
                <div>
                  <small>{title}</small>
                  <strong>{qrItem.name || "Item"}</strong>
                  {qrItem.price !== undefined && <span>{fmtBRL(qrItem.price)}</span>}
                </div>
              </div>
              <LocalQrCode
                value={`${linkApp}/item/view/${encodeURIComponent(qrItem.slug || qrItem.id)}`}
                title={qrItem.name || "Item"}
              />
              <p className="estx-qr-help">
                Aponte a câmera para abrir este item diretamente na Nexus.
              </p>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  );
}
