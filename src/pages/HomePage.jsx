import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaEye, FaMapMarkerAlt } from "react-icons/fa";

import { AuthContext } from "../App";
import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";
import EntityImage from "../components/EntityImage";
import ExploreCatalogs from "../components/home/ExploreCatalogs";
import { getFromApiV1 } from "../services/apiV1";
import useImageUtils from "../hooks/useImageUtils";

import "./HomePage.css";
import "./HomeDiscovery.css";

const DISCOVERY_CACHE_KEY = "nexus:home-discovery:v2";
const DISCOVERY_CACHE_TTL = 2 * 60 * 1000;
const EMPTY_DISCOVERY = {
  establishments: [],
  items: [],
  locations: [],
  city: null,
  uf: null,
};

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

const getCompanyImages = (establishment) => {
  const files = Array.isArray(establishment?.files) ? establishment.files : [];
  return [
    establishment?.images?.logo,
    establishment?.logo,
    files.find((file) => file?.type === "logo")?.public_url,
    establishment?.images?.background,
    establishment?.images?.cover,
    establishment?.background,
    establishment?.cover,
    files.find((file) => ["background", "cover", "banner"].includes(String(file?.type || "").toLowerCase()))?.public_url,
    files.find((file) => file?.is_primary)?.public_url,
    files[0]?.public_url,
  ];
};

const getRequestedLocation = () => ({
  city: localStorage.getItem("selectedCity") || null,
  uf: localStorage.getItem("selectedUF") || null,
});

const readDiscoveryCache = () => {
  try {
    const raw = sessionStorage.getItem(DISCOVERY_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    const requested = getRequestedLocation();

    if (!parsed?.data || Date.now() - Number(parsed.cachedAt || 0) > DISCOVERY_CACHE_TTL) return null;
    if ((parsed.requestedCity || null) !== requested.city || (parsed.requestedUf || null) !== requested.uf) return null;

    return parsed.data;
  } catch {
    return null;
  }
};

const writeDiscoveryCache = (data, requested) => {
  try {
    sessionStorage.setItem(DISCOVERY_CACHE_KEY, JSON.stringify({
      cachedAt: Date.now(),
      requestedCity: requested.city,
      requestedUf: requested.uf,
      data,
    }));
  } catch {
    // Cache is an optimization only; storage failures must never block discovery.
  }
};

function DiscoveryItemMedia({ image, name }) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(image) && !failed;

  return (
    <div className={`hp-item-card__image ${showImage ? "" : "hp-item-card__image--initials"}`}>
      {showImage
        ? <img src={image} alt={name || "Item"} loading="lazy" decoding="async" onError={() => setFailed(true)} />
        : <span aria-label={`Sem foto: ${name || "item"}`}>{getInitials(name)}</span>}
    </div>
  );
}

DiscoveryItemMedia.propTypes = {
  image: PropTypes.string,
  name: PropTypes.string,
};

function Rail({ title, subtitle, children, railRef }) {
  const move = (direction) => railRef.current?.scrollBy({
    left: direction * Math.max(280, railRef.current.clientWidth * 0.82),
    behavior: "smooth",
  });

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
  const [cachedDiscovery] = useState(() => readDiscoveryCache());
  const [discovery, setDiscovery] = useState(() => cachedDiscovery || EMPTY_DISCOVERY);
  const [discoveryLoading, setDiscoveryLoading] = useState(() => !cachedDiscovery);
  const [discoveryError, setDiscoveryError] = useState(false);
  const companiesRail = useRef(null);
  const itemsRail = useRef(null);

  const primaryPath = user ? "/establishment/my" : "/register";
  const primaryLabel = user ? "Gerenciar meus catálogos" : "Criar meu catálogo";

  useEffect(() => {
    const controller = new AbortController();

    const loadDiscovery = async () => {
      const requested = getRequestedLocation();

      try {
        if (!cachedDiscovery) setDiscoveryLoading(true);
        setDiscoveryError(false);

        const { data: ecosystemData } = await getFromApiV1("/discovery", {
          params: {
            city: requested.city || undefined,
            uf: requested.uf || undefined,
            limit: 60,
          },
          signal: controller.signal,
        });

        const nextDiscovery = {
          establishments: Array.isArray(ecosystemData?.establishments) ? ecosystemData.establishments : [],
          items: Array.isArray(ecosystemData?.items) ? ecosystemData.items : [],
          locations: Array.isArray(ecosystemData?.locations) ? ecosystemData.locations : [],
          city: requested.city || ecosystemData?.scope?.current_city || null,
          uf: requested.uf || ecosystemData?.scope?.current_uf || null,
        };

        setDiscovery(nextDiscovery);
        writeDiscoveryCache(nextDiscovery, requested);
      } catch (error) {
        if (error?.code !== "ERR_CANCELED" && !cachedDiscovery) setDiscoveryError(true);
      } finally {
        if (!controller.signal.aborted) setDiscoveryLoading(false);
      }
    };

    loadDiscovery();
    return () => controller.abort();
  }, [cachedDiscovery]);

  const locationLabel = useMemo(() => {
    const parts = [discovery.city, discovery.uf].filter(Boolean);
    return parts.length ? parts.join(" - ") : "em todos os catálogos disponíveis";
  }, [discovery.city, discovery.uf]);

  return (
    <>
      <GlobalNav />
      <main className="hp-wrapper">
        <section className="hp-hero">
          <div className="hp-hero__copy">
            <span className="hp-eyebrow">Seu catálogo. Um link. Um QR Code.</span>
            <h1>Descubra, crie e compartilhe catálogos de qualquer lugar.</h1>
            <p>A Nexus prioriza empresas próximas sem limitar a descoberta: explore catálogos da sua cidade, de outras regiões e de lugares que você pretende visitar.</p>
            <div className="hp-hero__actions">
              <button type="button" className="hp-primary-action" onClick={() => navigate(primaryPath)}>{primaryLabel}</button>
              {!user && <button type="button" className="hp-secondary-action" onClick={() => navigate("/login")}>Já tenho conta</button>}
            </div>
            <div className="hp-benefits">
              <span>Descoberta local</span><span>Explore outras cidades</span><span>QR Code e link</span>
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
              <span className="hp-eyebrow">Descoberta Nexus</span>
              <h2 id="hp-discovery-title">Empresas disponíveis {locationLabel}</h2>
              <p>Empresas cadastradas no ecossistema Peter Tecnet aparecem aqui quando o catálogo está habilitado para a Nexus. A localização apenas organiza a prioridade dos resultados.</p>
            </div>
            <div className="hp-location-chip"><FaMapMarkerAlt /> {locationLabel}</div>
          </div>

          {discoveryLoading && !cachedDiscovery && (
            <div className="hp-discovery-skeleton">{Array.from({ length: 4 }).map((_, index) => <span key={index} />)}</div>
          )}

          {!discoveryLoading && discoveryError && (
            <div className="hp-discovery-state">
              <strong>Não conseguimos carregar as empresas agora.</strong>
              <span>Tente atualizar a página em alguns instantes.</span>
            </div>
          )}

          {!discoveryError && discovery.establishments.length > 0 && (
            <Rail
              title="Empresas"
              subtitle="Catálogos habilitados para a Nexus, com os mais próximos priorizados quando sua localização estiver disponível."
              railRef={companiesRail}
            >
              {discovery.establishments.slice(0, 24).map((establishment) => {
                const companyName = establishment.fantasy || establishment.name || "Empresa";
                const sourceApp = establishment?.source_app?.name || establishment?.app?.name;
                return (
                  <article
                    className="hp-company-card"
                    key={establishment.id}
                    onClick={() => navigate(`/establishment/view/${establishment.slug}`)}
                    role="button"
                    tabIndex={0}
                  >
                    <EntityImage
                      src={getCompanyImages(establishment)}
                      name={companyName}
                      alt={companyName}
                      shape="establishment"
                      loading="lazy"
                    />
                    <div>
                      <h3>{companyName}</h3>
                      <span><FaMapMarkerAlt /> {[establishment.city, establishment.uf].filter(Boolean).join(" - ") || "Localização não informada"}</span>
                      <small>{sourceApp ? `${sourceApp} · ` : ""}{Number(establishment.total_views || 0).toLocaleString("pt-BR")} visualizações</small>
                    </div>
                  </article>
                );
              })}
            </Rail>
          )}

          {!discoveryError && discovery.items.length > 0 && (
            <Rail title="Itens em destaque" subtitle="Produtos e serviços dos catálogos disponíveis na Nexus." railRef={itemsRail}>
              {discovery.items.slice(0, 32).map((item) => {
                const files = Array.isArray(item?.files) ? item.files : [];
                const image = imageUrl(
                  item?.images?.avatar
                  || item?.images?.gallery?.[0]
                  || item?.image_url
                  || item?.image
                  || files.find((file) => file?.is_primary)?.public_url
                  || files[0]?.public_url,
                );
                const price = formatPrice(item.price);
                return (
                  <article
                    className="hp-item-card"
                    key={item.id}
                    onClick={() => navigate(`/item/view/${item.slug}`)}
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
              <strong>Ainda não encontramos empresas disponíveis.</strong>
              <span>Assim que houver catálogos habilitados para a Nexus eles aparecerão aqui.</span>
            </div>
          )}
        </section>

        <ExploreCatalogs
          currentCity={discovery.city}
          currentUf={discovery.uf}
          initialCompanies={discovery.establishments}
          initialLocations={discovery.locations}
          sourceReady={!discoveryLoading && !discoveryError}
        />

        <section className="hp-content" aria-labelledby="hp-how-title">
          <div className="hp-section-intro">
            <span className="hp-eyebrow">Como funciona</span>
            <h2 id="hp-how-title">Do cadastro ao compartilhamento em poucos passos.</h2>
            <p>Cadastre a empresa, organize os itens, publique e acompanhe o interesse do público pelas visualizações.</p>
          </div>
        </section>
      </main>
      <GlobalFooter />
    </>
  );
}
