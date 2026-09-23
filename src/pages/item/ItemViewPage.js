import React, { useContext, useEffect, useMemo, useState } from "react";
import { Alert, Badge, Button, Col, Container, Form, Modal, Row, Spinner } from "react-bootstrap";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  FaArrowLeft,
  FaArrowRight,
  FaBolt,
  FaCartPlus,
  FaCheck,
  FaClock,
  FaCode,
  FaEye,
  FaLayerGroup,
  FaPen,
  FaQuoteRight,
  FaRegLightbulb,
  FaRocket,
  FaShareAlt,
  FaWhatsapp,
} from "react-icons/fa";

import { AuthContext } from "../../App";
import GlobalNav from "../../components/GlobalNav";
import GlobalCard from "../../components/GlobalCard";
import EntityImage from "../../components/EntityImage";
import GlobalWhatsappButton from "../../components/GlobalWhatsappButton";
import useImageUtils from "../../hooks/useImageUtils";
import useItemView from "../../hooks/useItemView";
import useWhatsappLink from "../../hooks/useWhatsappLink";
import { addToCart } from "../../services/cart";
import { submitCatalogInquiry, trackCatalogEngagement } from "../../services/catalogEngagement";
import {
  asCatalogList,
  normalizeCatalogProfile,
  pricingPresentation,
} from "../../utils/catalogExperience";
import "./ItemViewPage.css";

const SITE_URL = "https://nexus.petertecnet.com.br";

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

const cleanText = (value, max = 160) =>
  String(value || "").replace(/\s+/g, " ").trim().slice(0, max);

const profileList = (profile, key) => asCatalogList(profile?.[key]);

const normalizeFaq = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => {
      if (typeof entry === "string") return { question: entry, answer: "" };
      return {
        question: String(entry?.question || entry?.title || "").trim(),
        answer: String(entry?.answer || entry?.description || "").trim(),
      };
    })
    .filter((entry) => entry.question);

const normalizeLinks = (value) =>
  (Array.isArray(value) ? value : [])
    .map((entry) => {
      if (typeof entry === "string") return { title: entry, description: "", url: "" };
      return {
        title: String(entry?.title || entry?.name || "").trim(),
        description: String(entry?.description || "").trim(),
        url: String(entry?.url || "").trim(),
      };
    })
    .filter((entry) => entry.title);

function RichList({ items, icon = <FaCheck /> }) {
  if (!items.length) return null;
  return (
    <div className="item-v2-list">
      {items.map((entry, index) => (
        <div className="item-v2-list__row" key={`${entry}-${index}`}>
          <span className="item-v2-list__icon">{icon}</span>
          <span>{entry}</span>
        </div>
      ))}
    </div>
  );
}

function Section({ eyebrow, title, children, className = "" }) {
  return (
    <section className={`item-v2-section ${className}`.trim()}>
      {eyebrow && <span className="item-v2-eyebrow">{eyebrow}</span>}
      <h2>{title}</h2>
      {children}
    </section>
  );
}

export default function ItemViewPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  const { imageUrl } = useImageUtils();
  const { item, otherItems, establishment, loading, error } = useItemView(slug);
  const whatsappLink = useWhatsappLink(establishment);
  const [quoteOpen, setQuoteOpen] = useState(false);
  const [quoteDirty, setQuoteDirty] = useState(false);
  const [quoteSubmitting, setQuoteSubmitting] = useState(false);
  const [quoteResult, setQuoteResult] = useState(null);
  const [quoteError, setQuoteError] = useState("");
  const [quoteFields, setQuoteFields] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    budget: "",
    urgency: "",
    message: "",
  });

  const profile = useMemo(() => normalizeCatalogProfile(item?.catalog_profile), [item]);
  const pricing = useMemo(() => pricingPresentation(item || {}), [item]);
  const benefits = useMemo(() => profileList(profile, "benefits"), [profile]);
  const deliverables = useMemo(() => profileList(profile, "deliverables"), [profile]);
  const audience = useMemo(() => profileList(profile, "audience"), [profile]);
  const useCases = useMemo(() => profileList(profile, "use_cases"), [profile]);
  const process = useMemo(() => profileList(profile, "process"), [profile]);
  const technologies = useMemo(() => profileList(profile, "technologies"), [profile]);
  const proofPoints = useMemo(() => profileList(profile, "proof_points"), [profile]);
  const faq = useMemo(() => normalizeFaq(profile?.faq), [profile]);
  const portfolio = useMemo(() => normalizeLinks(profile?.portfolio), [profile]);
  const articles = useMemo(() => normalizeLinks(profile?.related_articles), [profile]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [slug]);

  useEffect(() => {
    if (!user) return;
    setQuoteFields((current) => ({
      ...current,
      name: current.name || [user.first_name, user.last_name].filter(Boolean).join(" "),
      email: current.email || user.email || "",
      phone: current.phone || user.phone || "",
    }));
  }, [user]);

  useEffect(() => {
    if (!item) return undefined;

    const itemName = item.name || "Serviço";
    const companyName = establishment?.fantasy || establishment?.name;
    const description = cleanText(
      item.seo_description ||
        item.short_description ||
        item.description ||
        `${itemName}${companyName ? ` por ${companyName}` : ""} na Nexus.`
    );
    const canonical =
      item.canonical_url ||
      `${SITE_URL}/item/view/${encodeURIComponent(item.slug || slug || item.id)}`;
    const files = Array.isArray(item.files) ? item.files : [];
    const imageCandidate = [
      item.og_image,
      item.imageUrl,
      item.image_url,
      item.image,
      files.find((file) => file?.is_primary)?.public_url,
      files.find((file) => file?.type === "image")?.public_url,
      files[0]?.public_url,
    ].find(Boolean);
    const socialImage = imageCandidate ? imageUrl(imageCandidate) : null;
    const pageTitle =
      item.seo_title ||
      `${itemName}${companyName ? ` | ${companyName}` : ""} — Nexus`;

    document.title = pageTitle;
    setMeta("description", description);
    setMeta("robots", "index, follow, max-image-preview:large");
    setMeta("og:title", pageTitle, true);
    setMeta("og:description", description, true);
    setMeta("og:type", "website", true);
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
      ...(companyName ? { provider: { "@type": "Organization", name: companyName } } : {}),
      ...(Number(item.price_min || item.price || 0) > 0
        ? {
            offers: {
              "@type": "Offer",
              priceCurrency: "BRL",
              price: Number(item.price_min || item.price).toFixed(2),
              url: canonical,
            },
          }
        : {}),
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

  if (loading) {
    return (
      <>
        <GlobalNav />
        <div className="item-detail-loading"><Spinner animation="border" /></div>
      </>
    );
  }

  if (error || !item) {
    return (
      <>
        <GlobalNav />
        <Container className="py-5">
          <Alert variant="danger">Não foi possível carregar este item.</Alert>
        </Container>
      </>
    );
  }

  const itemFiles = Array.isArray(item.files) ? item.files : [];
  const itemImages = [
    item.imageUrl,
    item.image_url,
    item.image,
    item.og_image,
    itemFiles.find((file) => file?.is_primary)?.public_url,
    itemFiles.find((file) => file?.type === "image")?.public_url,
    itemFiles[0]?.public_url,
  ].filter(Boolean);
  const companyName = establishment?.fantasy || establishment?.name;
  const catalogPath = establishment?.slug ? `/catalog/${establishment.slug}` : "/";
  const canEdit = Boolean(
    user &&
      (Number(item.user_id) === Number(user.id) ||
        Number(establishment?.user_id) === Number(user.id) ||
        Number(establishment?.created_by) === Number(user.id))
  );
  const quoteEnabled = item.is_quote_enabled !== false;
  const canBuy =
    item.is_checkout_enabled !== false &&
    pricing.checkoutAmount > 0 &&
    establishment?.id;
  const whatsappMessage = `Olá, vi o serviço "${item.name}" na Nexus e gostaria de conversar sobre meu projeto.`;
  const whatsappHref = whatsappLink
    ? `${whatsappLink}${whatsappLink.includes("?") ? "&" : "?"}text=${encodeURIComponent(whatsappMessage)}`
    : null;

  const openQuote = () => {
    setQuoteOpen(true);
    setQuoteResult(null);
    setQuoteError("");
    trackCatalogEngagement(item.slug, "quote_start", {
      pricing_model: item.pricing_model || "fixed",
      source: "item_super_view",
    });
  };

  const closeQuote = () => {
    if (quoteDirty && !quoteResult) {
      trackCatalogEngagement(item.slug, "quote_abandon", { source: "item_super_view" });
    }
    setQuoteOpen(false);
  };

  const updateQuote = (field, value) => {
    setQuoteDirty(true);
    setQuoteFields((current) => ({ ...current, [field]: value }));
  };

  const submitQuote = async (event) => {
    event.preventDefault();
    if (!quoteFields.name.trim() || (!quoteFields.email.trim() && !quoteFields.phone.trim())) {
      setQuoteError("Informe seu nome e pelo menos um contato: e-mail ou telefone.");
      return;
    }
    setQuoteSubmitting(true);
    setQuoteError("");
    try {
      const response = await submitCatalogInquiry({ item, establishment, fields: quoteFields });
      setQuoteResult(response?.data || response);
      setQuoteDirty(false);
    } catch (requestError) {
      setQuoteError(
        requestError?.response?.data?.message ||
          "Não foi possível enviar agora. Você ainda pode falar conosco pelo WhatsApp."
      );
    } finally {
      setQuoteSubmitting(false);
    }
  };

  const buy = (checkout) => {
    trackCatalogEngagement(item.slug, "cta_click", {
      action: checkout ? "checkout" : "add_to_cart",
    });
    addToCart(item, establishment, 1);
    if (!checkout) return;
    if (user) navigate("/checkout");
    else navigate("/login", { state: { from: { pathname: "/checkout" } } });
  };

  const shareItem = async () => {
    trackCatalogEngagement(item.slug, "share", { channel: "native_or_clipboard" });
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: item.name,
          text: item.short_description || item.description,
          url,
        });
        return;
      } catch (shareError) {
        if (shareError?.name === "AbortError") return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Sharing should never block the item view.
    }
  };

  return (
    <div className="item-v2-page">
      <GlobalNav />

      <main>
        <div className="item-v2-topbar">
          <Container>
            <div className="item-v2-topbar__inner">
              <Link to={catalogPath} className="item-v2-back"><FaArrowLeft /> Catálogo</Link>
              <div className="item-v2-topbar__actions">
                <button type="button" onClick={shareItem}><FaShareAlt /> Compartilhar</button>
                {canEdit && (
                  <button type="button" onClick={() => navigate(`/item/update/${item.id}`)}>
                    <FaPen /> Editar
                  </button>
                )}
              </div>
            </div>
          </Container>
        </div>

        <section className="item-v2-hero">
          <Container>
            <Row className="g-4 g-xl-5 align-items-center">
              <Col lg={6}>
                <div className="item-v2-visual">
                  {itemImages.length ? (
                    <EntityImage
                      src={itemImages}
                      name={item.name}
                      alt={item.name}
                      className="item-v2-visual__image"
                      loading="eager"
                    />
                  ) : (
                    <div className="item-v2-visual__fallback">
                      <span>{item.category || "Tecnologia"}</span>
                      <strong>{item.name}</strong>
                    </div>
                  )}
                  <div className="item-v2-visual__glow" />
                </div>
              </Col>

              <Col lg={6}>
                <div className="item-v2-hero__content">
                  <div className="item-v2-badges">
                    {item.category && <Badge>{item.category}</Badge>}
                    {item.subcategory && <Badge bg="secondary">{item.subcategory}</Badge>}
                    {item.is_featured && <span className="item-v2-featured"><FaBolt /> Destaque</span>}
                  </div>

                  <h1>{item.name}</h1>
                  <p className="item-v2-lead">
                    {item.short_description || profile?.headline || item.description}
                  </p>

                  {companyName && (
                    <Link to={catalogPath} className="item-v2-provider">
                      por {companyName} <FaArrowRight />
                    </Link>
                  )}

                  <div className="item-v2-pricebox">
                    <span>Investimento</span>
                    <strong>{pricing.primary}</strong>
                    {pricing.secondary && <small>{profile?.price_note || pricing.secondary}</small>}
                  </div>

                  <div className="item-v2-hero__cta">
                    {quoteEnabled && (
                      <Button className="item-v2-primary" onClick={openQuote}>
                        <FaQuoteRight /> {profile?.cta_label || "Solicitar diagnóstico"}
                      </Button>
                    )}
                    {whatsappHref && (
                      <a
                        className="item-v2-whatsapp"
                        href={whatsappHref}
                        target="_blank"
                        rel="noreferrer"
                        onClick={() =>
                          trackCatalogEngagement(item.slug, "whatsapp_click", { source: "hero" })
                        }
                      >
                        <FaWhatsapp /> Falar no WhatsApp
                      </a>
                    )}
                  </div>

                  {canBuy && (
                    <div className="item-v2-commerce">
                      <Button variant="outline-info" onClick={() => buy(false)}>
                        <FaCartPlus /> Adicionar
                      </Button>
                      <Button onClick={() => buy(true)}>Comprar agora</Button>
                    </div>
                  )}

                  <div className="item-v2-meta">
                    {item.total_views != null && (
                      <span><FaEye /> {Number(item.total_views || 0).toLocaleString("pt-BR")} visualizações</span>
                    )}
                    {profile?.duration_text && <span><FaClock /> {profile.duration_text}</span>}
                    <span><FaLayerGroup /> Solução sob medida</span>
                  </div>
                </div>
              </Col>
            </Row>
          </Container>
        </section>

        <Container className="item-v2-content">
          {(profile?.problem || audience.length > 0) && (
            <Row className="g-4">
              {profile?.problem && (
                <Col lg={7}>
                  <Section eyebrow="O problema" title="O que esta solução resolve">
                    <p className="item-v2-copy">{profile.problem}</p>
                  </Section>
                </Col>
              )}
              {audience.length > 0 && (
                <Col lg={5}>
                  <Section eyebrow="Para quem" title="Quando faz sentido">
                    <RichList items={audience} icon={<FaRegLightbulb />} />
                  </Section>
                </Col>
              )}
            </Row>
          )}

          {(benefits.length > 0 || deliverables.length > 0) && (
            <Row className="g-4">
              {benefits.length > 0 && (
                <Col lg={6}>
                  <Section eyebrow="Resultado" title="Benefícios para a operação">
                    <RichList items={benefits} />
                  </Section>
                </Col>
              )}
              {deliverables.length > 0 && (
                <Col lg={6}>
                  <Section eyebrow="Escopo" title="O que você recebe">
                    <RichList items={deliverables} icon={<FaRocket />} />
                  </Section>
                </Col>
              )}
            </Row>
          )}

          {process.length > 0 && (
            <Section eyebrow="Método" title="Como o projeto acontece">
              <div className="item-v2-steps">
                {process.map((entry, index) => (
                  <article key={`${entry}-${index}`}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    <p>{entry}</p>
                  </article>
                ))}
              </div>
            </Section>
          )}

          {useCases.length > 0 && (
            <Section eyebrow="Aplicações" title="Exemplos de uso">
              <div className="item-v2-grid">
                {useCases.map((entry, index) => (
                  <article key={`${entry}-${index}`}><FaBolt /><p>{entry}</p></article>
                ))}
              </div>
            </Section>
          )}

          {(proofPoints.length > 0 || portfolio.length > 0) && (
            <Section eyebrow="Capacidade" title="Experiência que sustenta a entrega">
              {proofPoints.length > 0 && <RichList items={proofPoints} icon={<FaCode />} />}
              {portfolio.length > 0 && (
                <div className="item-v2-portfolio">
                  {portfolio.map((entry, index) => (
                    <article key={`${entry.title}-${index}`}>
                      <strong>{entry.title}</strong>
                      {entry.description && <p>{entry.description}</p>}
                      {entry.url && (
                        <a href={entry.url} target="_blank" rel="noreferrer">
                          Conhecer <FaArrowRight />
                        </a>
                      )}
                    </article>
                  ))}
                </div>
              )}
            </Section>
          )}

          {technologies.length > 0 && (
            <Section eyebrow="Tecnologia" title="Base técnica quando ela agrega valor">
              <div className="item-v2-chips">
                {technologies.map((entry) => <span key={entry}>{entry}</span>)}
              </div>
            </Section>
          )}

          {item.description && (
            <Section eyebrow="Detalhes" title="Sobre esta solução">
              <p className="item-v2-copy item-v2-copy--pre">{item.description}</p>
            </Section>
          )}

          {faq.length > 0 && (
            <Section eyebrow="Dúvidas" title="Perguntas frequentes">
              <div className="item-v2-faq">
                {faq.map((entry, index) => (
                  <details key={`${entry.question}-${index}`}>
                    <summary>{entry.question}</summary>
                    {entry.answer && <p>{entry.answer}</p>}
                  </details>
                ))}
              </div>
            </Section>
          )}

          {articles.length > 0 && (
            <Section eyebrow="Conteúdo" title="Para aprofundar">
              <div className="item-v2-portfolio">
                {articles.map((entry, index) => (
                  <article key={`${entry.title}-${index}`}>
                    <strong>{entry.title}</strong>
                    {entry.description && <p>{entry.description}</p>}
                    {entry.url && (
                      <a href={entry.url} target="_blank" rel="noreferrer">
                        Ler conteúdo <FaArrowRight />
                      </a>
                    )}
                  </article>
                ))}
              </div>
            </Section>
          )}

          {otherItems?.length > 0 && (
            <Section eyebrow="Continue explorando" title="Soluções relacionadas">
              <Row className="g-3">
                {otherItems.slice(0, 8).map((related) => (
                  <Col key={related.id} xs={12} sm={6} lg={3}>
                    <GlobalCard item={related} navigate={navigate} />
                  </Col>
                ))}
              </Row>
            </Section>
          )}
        </Container>
      </main>

      {quoteEnabled && (
        <div className="item-v2-mobile-cta">
          <Button onClick={openQuote}>{profile?.cta_label || "Solicitar diagnóstico"}</Button>
        </div>
      )}

      <Modal show={quoteOpen} onHide={closeQuote} centered size="lg" className="item-v2-quote-modal">
        <Modal.Body>
          <div className="item-v2-quote">
            <button type="button" className="item-v2-quote__close" onClick={closeQuote} aria-label="Fechar">×</button>
            {quoteResult ? (
              <div className="item-v2-quote__success">
                <span><FaCheck /></span>
                <h2>Solicitação recebida</h2>
                <p>
                  Sua oportunidade entrou no nosso fluxo comercial com o serviço e a origem desta solicitação.
                </p>
                {quoteResult?.reference && <strong>Referência: {quoteResult.reference}</strong>}
                <Button onClick={() => setQuoteOpen(false)}>Concluir</Button>
              </div>
            ) : (
              <>
                <span className="item-v2-eyebrow">Briefing rápido</span>
                <h2>Conte um pouco sobre seu projeto</h2>
                <p>Não precisa ter tudo definido. Dê contexto suficiente para o próximo passo.</p>

                {quoteError && <Alert variant="danger">{quoteError}</Alert>}

                <Form onSubmit={submitQuote}>
                  <Row className="g-3">
                    <Col md={6}>
                      <Form.Label>Nome *</Form.Label>
                      <Form.Control value={quoteFields.name} onChange={(e) => updateQuote("name", e.target.value)} />
                    </Col>
                    <Col md={6}>
                      <Form.Label>Empresa</Form.Label>
                      <Form.Control value={quoteFields.company} onChange={(e) => updateQuote("company", e.target.value)} />
                    </Col>
                    <Col md={6}>
                      <Form.Label>E-mail</Form.Label>
                      <Form.Control type="email" value={quoteFields.email} onChange={(e) => updateQuote("email", e.target.value)} />
                    </Col>
                    <Col md={6}>
                      <Form.Label>Telefone / WhatsApp</Form.Label>
                      <Form.Control value={quoteFields.phone} onChange={(e) => updateQuote("phone", e.target.value)} />
                    </Col>
                    <Col md={6}>
                      <Form.Label>Faixa de investimento</Form.Label>
                      <Form.Select value={quoteFields.budget} onChange={(e) => updateQuote("budget", e.target.value)}>
                        <option value="">Ainda não defini</option>
                        <option value="ate-5k">Até R$ 5 mil</option>
                        <option value="5k-15k">R$ 5 mil a R$ 15 mil</option>
                        <option value="15k-30k">R$ 15 mil a R$ 30 mil</option>
                        <option value="30k-mais">Acima de R$ 30 mil</option>
                      </Form.Select>
                    </Col>
                    <Col md={6}>
                      <Form.Label>Quando pretende começar?</Form.Label>
                      <Form.Select value={quoteFields.urgency} onChange={(e) => updateQuote("urgency", e.target.value)}>
                        <option value="">Quero entender primeiro</option>
                        <option value="agora">O quanto antes</option>
                        <option value="30-dias">Nos próximos 30 dias</option>
                        <option value="60-90-dias">Em 60 a 90 dias</option>
                        <option value="planejamento">Ainda em planejamento</option>
                      </Form.Select>
                    </Col>
                    <Col xs={12}>
                      <Form.Label>O que precisa resolver?</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={5}
                        value={quoteFields.message}
                        onChange={(e) => updateQuote("message", e.target.value)}
                        placeholder="Descreva o processo, problema, ideia ou resultado que você quer alcançar."
                      />
                    </Col>
                  </Row>
                  <div className="item-v2-quote__footer">
                    <small>Serviço selecionado: {item.name}</small>
                    <Button type="submit" disabled={quoteSubmitting}>
                      {quoteSubmitting ? "Enviando…" : "Enviar briefing"} <FaArrowRight />
                    </Button>
                  </div>
                </Form>
              </>
            )}
          </div>
        </Modal.Body>
      </Modal>

      <GlobalWhatsappButton link={whatsappLink} message={whatsappMessage} />
    </div>
  );
}
