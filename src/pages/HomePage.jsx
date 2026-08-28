import React, { useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowRight, FaEye, FaLocationDot } from "react-icons/fa6";

import { AuthContext } from "../App";
import GlobalNav from "../components/GlobalNav";
import GlobalFooter from "../components/GlobalFooter";
import api from "../services/api";
import { appId } from "../config";
import useImageUtils from "../hooks/useImageUtils";

import "./HomePage.css";
import "./HomeDiscovery.css";

const formatPrice = (value) => {
  if (value === null || value === undefined || value === "" || !Number.isFinite(Number(value))) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(value));
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
        const { data } = await api.get(`/home/${appId}`, { signal: controller.signal });
        const payload = data?.payload || {};
        setDiscovery({
          establishments: Array.isArray(payload.establishments) ? payload.establishments : [],
          items: Array.isArray(payload.items) ? payload.items : [],
          city: data?.city || payload?.app?.city || null,
          uf: data?.uf || payload?.app?.uf || null,
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
            <h1>Descubra, crie e compartilhe catálogos da sua região.</h1>
            <p>
              A Nexus conecta visitantes aos catálogos próximos e dá às empresas uma forma rápida,
              visual e profissional de apresentar seus itens online.
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
              <span><i className="fas fa-box-open" /> Itens públicos</span>
              <span><i className="fas fa-qrcode" /> QR Code e link</span>
            </div>
          </div>

          <div className="hp-hero__visual" aria-hidden="true">
            <div className="hp-orbit hp-orbit--one" />
            <div className="hp-orbit hp-orbit--two" />
            <div className="hp-logo-card">
              <img src="/images/logo.png" alt="" />
              <strong>Nexus</strong>
              <span>catálogos perto de você</span>
            </div>
          </div>
        </section>

        <section className="hp-discovery" aria-labelledby="hp-discovery-title">
          <div className="hp-discovery-intro">
            <div>
              <span className="hp-eyebrow">Explore sem login</span>
              <h2 id="hp-discovery-title">O que está disponível {locationLabel}</h2>
              <p>Empresas e itens públicos são carregados pela localização aproximada do visitante.</p>
            </div>
            <div className="hp-location-chip"><FaLocationDot /> {locationLabel}</div>
          </div>

          {discoveryLoading && (
            <div className="hp-discovery-skeleton" aria-label="Carregando catálogos locais">
              {Array.from({ length: 4 }).map((_, index) => <span key={index} />)}
            </div>
          )}

          {!discoveryLoading && discoveryError && (
            <div className="hp-discovery-state">
              <strong>Não conseguimos identificar os catálogos próximos agora.</strong>
              <span>Você ainda pode acessar catálogos por link ou criar o seu normalmente.</span>
            </div>
          )}

          {!discoveryLoading && !discoveryError && discovery.establishments.length > 0 && (
            <Rail
              title="Empresas na sua localização"
              subtitle="Abra o catálogo diretamente, sem precisar criar uma conta."
              railRef={companiesRail}
            >
              {discovery.establishments.slice(0, 24).map((establishment) => {
                const image = imageUrl(establishment?.images?.logo || establishment?.images?.background) || "/images/logo.png";
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
                    <img src={image} alt={establishment.name} loading="lazy" />
                    <div>
                      <h3>{establishment.name}</h3>
                      <span><FaLocationDot /> {[establishment.city, establishment.uf].filter(Boolean).join(" - ") || locationLabel}</span>
                      <small><FaEye /> {Number(establishment.total_views || 0).toLocaleString("pt-BR")} visualizações</small>
                    </div>
                  </article>
                );
              })}
            </Rail>
          )}

          {!discoveryLoading && !discoveryError && discovery.items.length > 0 && (
            <Rail
              title="Itens perto de você"
              subtitle="Veja o que as empresas da região estão apresentando em seus catálogos."
              railRef={itemsRail}
            >
              {discovery.items.slice(0, 32).map((item) => {
                const image = imageUrl(item?.images?.avatar || item?.images?.gallery?.[0]) || "/images/logo.png";
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
                    <div className="hp-item-card__image"><img src={image} alt={item.name} loading="lazy" /></div>
                    <div className="hp-item-card__body">
                      <span className="hp-item-card__company">{item.establishment?.name || "Catálogo Nexus"}</span>
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
              <strong>Ainda não há catálogos publicados em {locationLabel}.</strong>
              <span>Cadastre uma empresa e seja uma das primeiras a aparecer nesta região.</span>
              <button type="button" className="hp-primary-action" onClick={() => navigate(primaryPath)}>{primaryLabel}</button>
            </div>
          )}
        </section>

        <section className="hp-content" aria-labelledby="hp-how-title">
          <div className="hp-section-intro">
            <span className="hp-eyebrow">Como funciona</span>
            <h2 id="hp-how-title">Do cadastro ao compartilhamento em poucos passos.</h2>
            <p>Cadastre a empresa, organize os itens, publique e acompanhe o interesse do público pelas visualizações.</p>
          </div>

          <div className="hp-flow-grid">
            <article className="hp-flow-card"><span>01</span><h3>Cadastre a empresa</h3><p>Crie um espaço próprio com identidade, informações e localização.</p></article>
            <article className="hp-flow-card"><span>02</span><h3>Adicione e edite itens</h3><p>Mantenha fotos, descrição, preço, categoria e disponibilidade sempre atualizados.</p></article>
            <article className="hp-flow-card"><span>03</span><h3>Ganhe visibilidade</h3><p>Itens e empresas podem aparecer para visitantes da mesma localização, mesmo sem login.</p></article>
            <article className="hp-flow-card"><span>04</span><h3>Compartilhe e acompanhe</h3><p>Use QR Code, link público e visualizações para entender o interesse pelo catálogo.</p></article>
          </div>
        </section>
      </main>

      <GlobalFooter />
    </>
  );
}
