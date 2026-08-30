import React, { useEffect, useMemo, useRef, useState } from "react";
import PropTypes from "prop-types";
import { FaArrowLeft, FaArrowRight, FaEye, FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

import api from "../../services/api";
import { appId } from "../../config";
import useImageUtils from "../../hooks/useImageUtils";
import "./ExploreCatalogs.css";

const getInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

function CompanyMedia({ company, imageUrl }) {
  const [failed, setFailed] = useState(false);
  const files = Array.isArray(company?.files) ? company.files : [];
  const path = company?.images?.logo
    || company?.images?.background
    || company?.logo
    || files.find((file) => file?.type === "logo")?.public_url
    || files.find((file) => file?.type === "background")?.public_url
    || files[0]?.public_url;
  const image = imageUrl(path);

  if (image && !failed) {
    return <img src={image} alt={company?.fantasy || company?.name || "Empresa"} loading="lazy" onError={() => setFailed(true)} />;
  }

  return <span className="explore-company-card__initials">{getInitials(company?.fantasy || company?.name)}</span>;
}

CompanyMedia.propTypes = {
  company: PropTypes.object.isRequired,
  imageUrl: PropTypes.func.isRequired,
};

function RailControls({ railRef, label }) {
  const move = (direction) => {
    railRef.current?.scrollBy({ left: direction * Math.max(300, railRef.current.clientWidth * 0.82), behavior: "smooth" });
  };

  return (
    <div className="explore-catalogs__controls" aria-label={`Navegar em ${label}`}>
      <button type="button" onClick={() => move(-1)} aria-label="Anterior"><FaArrowLeft /></button>
      <button type="button" onClick={() => move(1)} aria-label="Próximo"><FaArrowRight /></button>
    </div>
  );
}

RailControls.propTypes = {
  railRef: PropTypes.shape({ current: PropTypes.instanceOf(Element) }).isRequired,
  label: PropTypes.string.isRequired,
};

export default function ExploreCatalogs({ currentCity, currentUf }) {
  const navigate = useNavigate();
  const { imageUrl } = useImageUtils();
  const railRef = useRef(null);
  const [locations, setLocations] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [query, setQuery] = useState("");
  const [appliedQuery, setAppliedQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const selected = useMemo(() => {
    if (!selectedLocation) return null;
    const [uf, ...cityParts] = selectedLocation.split("|");
    return { uf, city: cityParts.join("|") };
  }, [selectedLocation]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      try {
        setLoading(true);
        setError(false);
        const { data } = await api.get("/nexus/discovery", {
          params: {
            app_id: appId,
            city: currentCity || undefined,
            uf: currentUf || undefined,
            target_city: selected?.city || undefined,
            target_uf: selected?.uf || undefined,
            q: appliedQuery || undefined,
            limit: 60,
          },
          signal: controller.signal,
        });

        setCompanies(Array.isArray(data?.establishments) ? data.establishments : []);
        if (Array.isArray(data?.locations)) setLocations(data.locations);
      } catch (requestError) {
        if (requestError?.code === "ERR_CANCELED") return;
        setError(true);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };

    load();
    return () => controller.abort();
  }, [currentCity, currentUf, selected, appliedQuery]);

  const submitSearch = (event) => {
    event.preventDefault();
    setAppliedQuery(query.trim());
  };

  return (
    <section className="explore-catalogs" aria-labelledby="explore-catalogs-title">
      <div className="explore-catalogs__header">
        <div>
          <span className="hp-eyebrow">Explore além da sua região</span>
          <h2 id="explore-catalogs-title">Descubra catálogos de outras cidades</h2>
          <p>Use sua localização como ponto de partida, não como limite. Pesquise empresas para uma viagem, outra cidade ou simplesmente para conhecer novos catálogos.</p>
        </div>
        <RailControls railRef={railRef} label="catálogos de outras cidades" />
      </div>

      <form className="explore-catalogs__filters" onSubmit={submitSearch}>
        <label>
          <span>Cidade</span>
          <select value={selectedLocation} onChange={(event) => setSelectedLocation(event.target.value)}>
            <option value="">Outras regiões</option>
            {locations.map((location) => (
              <option key={`${location.uf}-${location.city}`} value={`${location.uf}|${location.city}`}>
                {location.label || `${location.city} - ${location.uf}`}
              </option>
            ))}
          </select>
        </label>

        <label className="explore-catalogs__search">
          <span>Buscar catálogo</span>
          <div>
            <FaSearch aria-hidden="true" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Empresa, cidade ou categoria"
            />
            <button type="submit">Buscar</button>
          </div>
        </label>
      </form>

      {loading && <div className="explore-catalogs__state">Carregando catálogos de outras regiões…</div>}
      {!loading && error && <div className="explore-catalogs__state">Não foi possível carregar outros catálogos agora.</div>}
      {!loading && !error && companies.length === 0 && <div className="explore-catalogs__state">Nenhum catálogo encontrado para esse filtro.</div>}

      {!loading && !error && companies.length > 0 && (
        <div className="explore-catalogs__rail" ref={railRef}>
          {companies.map((company) => {
            const name = company.fantasy || company.name || "Empresa";
            const location = [company.city, company.uf].filter(Boolean).join(" - ") || "Localização não informada";
            return (
              <article
                key={company.id}
                className="explore-company-card"
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/catalog/${company.slug}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") navigate(`/catalog/${company.slug}`);
                }}
              >
                <div className="explore-company-card__media">
                  <CompanyMedia company={company} imageUrl={imageUrl} />
                </div>
                <div className="explore-company-card__body">
                  <span className="explore-company-card__location"><FaMapMarkerAlt /> {location}</span>
                  <h3>{name}</h3>
                  {company.description && <p>{company.description}</p>}
                  <div className="explore-company-card__footer">
                    <span><FaEye /> {Number(company.total_views || 0).toLocaleString("pt-BR")}</span>
                    <strong>Ver catálogo</strong>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

ExploreCatalogs.propTypes = {
  currentCity: PropTypes.string,
  currentUf: PropTypes.string,
};
