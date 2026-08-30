import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaEye, FaMapMarkerAlt } from "react-icons/fa";

import { AuthContext } from "../App";
import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";
import ExploreCatalogs from "../components/home/ExploreCatalogs";
import api from "../services/api";
import { appId } from "../config";
import useImageUtils from "../hooks/useImageUtils";

import "./HomePage.css";
import "./HomeDiscovery.css";

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
};

const getInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const getCompanyImage = (establishment) => {
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  return establishment?.images?.logo
    || establishment?.images?.background
    || establishment?.logo
    || files.find((file) => file?.type === "logo")?.public_url
    || files.find((file) => file?.type === "background")?.public_url
    || files[0]?.public_url
    || null;
};

function DiscoveryItemMedia({ image, name }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <div className={`hp-item-card__image ${showImage ? "" : "hp-item-card__image--initials"}`}>
      {showImage ? (
        <img src={image} alt={name || "Item"} loading="lazy" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={`Sem foto: ${name || "item"}`}>{getInitials(name)}</span>
      )}
    </div>
  );
}

DiscoveryItemMedia.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string,
};

function Rail({ title, subtitle, children, railRef }) {
  const move = (direction) => {
    railRef.current?.scrollBy({ left: direction * Math.max(280, railRef.current.clientWidth * 0.82), behavior: "smooth" });
  };

  return (
    <section className="hp-discovery-section">
      <div className="hp-discovery-heading">
        <div>
          <h2>{title}</h2>
          <p>{subtitle}</p>
        </div>
        <div className="hp-rail-controls" aria-label={`Navegar em ${title}`}>
          <button type="button" onClick={() => move(-1)} aria-label="Anterior"><FaArrowLeft /></button>
          <button type="button" onClick={() => move(1)} aria-label="Próximo"><FaArrowRight /></button>
        </div>
      </div>
      <div className="hp-discovery-rail" ref={railRef}>{children}</div>
    </section>
  );
}

Rail.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  railRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
};

export default function HomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const { imageUrl } = useImageUtils();
  const [discovery, setDiscovery] = useState({ establishments: [], items: [], city: null, uf: null });
  const [discoveryLoading, setDiscoveryLoading] = useState(true);
  const [discoveryError, setDiscoveryError] = useState(false);
  const companiesRail = useRef(null);
  const itemsRail = useRef(null);

  const primaryPath = user ? "/establishment/my" : "/register";
  const primaryLabel = user ? "Gerenciar meus catálogos" : "Criar meu catálogo";

  useEffect(() => {
    const controller = new AbortController();

    const loadDiscovery = async () => {
      try {
        setDiscoveryLoading(true);
        setDiscoveryError(false);

        // O endpoint home continua sendo usado apenas para descobrir a localizacao
        // aproximada do visitante. Os dados exibidos na Nexus vem da descoberta
        // transversal, que consulta empresas de TODO o ecossistema Peter Tecnet.
        const { data: locationData } = await api.get(`/home/${appId}`, {
          signal: controller.signal,
        });

        const locationPayload = locationData?.payload || {};
        const city = locationData?.city || locationPayload?.app?.city || null;
        const uf = locationData?.uf || locationPayload?.app?.uf || null;

        const { data: ecosystemData } = await api.get("/nexus/discovery", {
          params: {
            app_id: appId,
            target_city: city || undefined,
            target_uf: uf || undefined,
            limit: 100,
          },
          signal: controller.signal,
        });

        setDiscovery({
          establishments: Array.isArray(ecosystemData?.establishments) ? ecosystemData.establishments : [],
          items: Array.isArray(ecosystemData?.items) ? ecosystemData.items : [],
          city,
          uf,
        });
      } catch (error) {
        if (error?.code === "ERR_CANCELED") return;
        setDiscoveryError(true);
      } finally {
        if (!controller.signal.aborted) setDiscoveryLoading(false);
      }
    };

    loadDiscovery();
    return () => controller.abort();
  }, []);

  const locationLabel = useMemo(() => {
    const parts = [discovery.city, discovery.uf].filter(Boolean);
    return parts.length ? parts.join(" - ") : "perto de você";
  }, [discovery.city, discovery.uf]);

  return (
    <>
      <GlobalNav />

      <main className="hp-wrapper">
        <section className="hp-hero">
          <div className="hp-hero__copy">
            <span className="hp-eyebrow">Seu catálogo. Um link. Um QR Code.</span>
            <h1>Descubra, crie e compartilhe catálogos de qualquer lugar.</h1>
            <p>
              A Nexus prioriza empresas próximas sem limitar a descoberta: explore catálogos da sua cidade,
              de outras regiões e de lugares que você pretende visitar.
            </p>

            <div className="hp-hero__actions">
              <button type="button" className="hp-primary-action" onClick={() => navigate(primaryPath)}>
                {primaryLabel}
              </button>
              {!user && (
                <button type="button" className="hp-secondary-action" onClick={() => navigate("/login")}>
                  Já tenho conta
                </button>
              )}
            </div>

            <div className="hp-benefits" aria-label="Benefícios da Nexus">
              <span><i className="fas fa-location-dot" /> Descoberta local</span>
              <span><i className="fas fa-compass" /> Explore outras cidades</span>
              <span><i className="fas fa-qrcode" /> QR Code e link</span>
            </div>
          </div>

          <div className="hp-hero__visual" aria-hidden="true">
            <div className="hp-orbit hp-orbit--one" />
            <div className="hp-orbit hp-orbit--two" />
            <div className="hp-logo-card">
              <img src="/images/logo.png" alt="" />
              <strong>Nexus</strong>
              <span>catálogos de todos os lugares</span>
            </div>
          </div>
        </section>

        <section className="hp-discovery" aria-labelledby="hp-discovery-title">
          <div className="hp-discovery-intro">
            <div>
              <span className="hp-eyebrow">Perto de você</span>
              <h2 id="hp-discovery-title">O que está disponível {locationLabel}</h2>
              <p>Empresas do ecossistema Peter Tecnet aparecem aqui independentemente do aplicativo em que foram cadastradas.</p>
            </div>
            <div className="hp-location-chip"><FaMapMarkerAlt /> {locationLabel}</div>
          </div>

          {discoveryLoading && (
            <div className="hp-discovery-skeleton" aria-label="Carregando catálogos locais">
              {Array.from({ length: 4 }).map((_, index) => <span key={index} />)}
            </div>
          )}

          {!discoveryLoading && discoveryError && (
            <div className="hp-discovery-state">
              <strong>Não conseguimos identificar os catálogos próximos agora.</strong>
              <span>Você ainda pode explorar outras cidades logo abaixo.</span>
            </div>
          )}

          {!discoveryLoading && !discoveryError && discovery.establishments.length > 0 && (
            <Rail
              title="Empresas na sua localização"
              subtitle="Rasoio, Plat, Nexus e demais aplicativos participam da descoberta da Nexus."
              railRef={companiesRail}
            >
              {discovery.establishments.slice(0, 24).map((establishment) => {
                const image = imageUrl(getCompanyImage(establishment)) || "/images/logo.png";
                const sourceApp = establishment?.source_app?.name || establishment?.app?.name;
                return (
                  <article
                    className="hp-company-card"
                    key={establishment.id}
                    onClick={() => navigate(`/catalog/${establishment.slug}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") navigate(`/catalog/${establishment.slug}`);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <img src={image} alt={establishment.fantasy || establishment.name} loading="lazy" />
                    <div>
                      <h3>{establishment.fantasy || establishment.name}</h3>
                      <span><FaMapMarkerAlt /> {[establishment.city, establishment.uf].filter(Boolean).join(" - ") || locationLabel}</span>
                      {sourceApp && <small>{sourceApp} · {Number(establishment.total_views || 0).toLocaleString("pt-BR")} visualizações</small>}
                      {!sourceApp && <small><FaEye /> {Number(establishment.total_views || 0).toLocaleString("pt-BR")} visualizações</small>}
                    </div>
                  </article>
                );
              })}
            </Rail>
          )}

          {!discoveryLoading && !discoveryError && discovery.items.length > 0 && (
            <Rail
              title="Itens perto de você"
              subtitle="Itens das empresas da região, mesmo quando a empresa nasceu em outro aplicativo Peter Tecnet."
              railRef={itemsRail}
            >
              {discovery.items.slice(0, 32).map((item) => {
                const files = Array.isArray(item?.files) ? item.files : [];
                const image = imageUrl(
                  item?.images?.avatar
                  || item?.images?.gallery?.[0]
                  || item?.image_url
                  || item?.image
                  || files.find((file) => file?.is_primary)?.public_url
                  || files.find((file) => file?.type === "image")?.public_url
                  || files[0]?.public_url
                );
                const price = formatPrice(item.price);
                return (
                  <article
                    className="hp-item-card"
                    key={item.id}
                    onClick={() => navigate(`/item/view/${item.slug}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") navigate(`/item/view/${item.slug}`);
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <DiscoveryItemMedia image={image} name={item.name} />
                    <div className="hp-item-card__body">
                      <span className="hp-item-card__company">{item.establishment?.fantasy || item.establishment?.name || "Catálogo Nexus"}</span>
                      <h3>{item.name}</h3>
                      <div className="hp-item-card__meta">
                        {price && <strong>{price}</strong>}
                        <span><FaEye /> {Number(item.total_views || 0).toLocaleString("pt-BR")}</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </Rail>
          )}

          {!discoveryLoading && !discoveryError && discovery.establishments.length === 0 && discovery.items.length === 0 && (
            <div className="hp-discovery-state">
              <strong>Ainda não encontramos empresas em {locationLabel}.</strong>
              <span>Explore todas as outras regiões logo abaixo.</span>
            </div>
          )}
        </section>

        <ExploreCatalogs currentCity={discovery.city} currentUf={discovery.uf} />

        <section className="hp-content" aria-labelledby="hp-how-title">
          <div className="hp-section-intro">
            <span className="hp-eyebrow">Como funciona</span>
            <h2 id="hp-how-title">Do cadastro ao compartilhamento em poucos passos.</h2>
            <p>Cadastre a empresa, organize os itens, publique e acompanhe o interesse do público pelas visualizações.</p>
          </div>

          <div className="hp-flow-grid">
            <article className="hp-flow-card"><span>01</span><h3>Cadastre a empresa</h3><p>Crie um espaço próprio com identidade, informações e localização.</p></article>
            <article className="hp-flow-card"><span>02</span><h3>Adicione e edite itens</h3><p>Mantenha fotos, descrição, preço, categoria e disponibilidade sempre atualizados.</p></article>
            <article className="hp-flow-card"><span>03</span><h3>Ganhe visibilidade</h3><p>Itens e empresas podem aparecer primeiro para visitantes próximos e também ser descobertos por pessoas de outras regiões.</p></article>
            <article className="hp-flow-card"><span>04</span><h3>Compartilhe e acompanhe</h3><p>Use QR Code, link público e visualizações para entender o interesse pelo catálogo.</p></article>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </>
  );
}
