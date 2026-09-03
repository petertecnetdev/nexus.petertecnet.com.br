// src/components/establishment/EstablishmentDashboard.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import EntityImage from "../EntityImage";
import EstablishmentActionsBar from "./EstablishmentActionsBar";
import "./EstablishmentDashboard.css";

export default function EstablishmentDashboard({ establishment, navigate, onDelete, deleting, onActivate, activating }) {
  const name = establishment.fantasy || establishment.name || "Empresa";
  const catalogActive = Boolean(establishment.catalog_active);
  const catalogId = establishment.catalog_establishment_id || establishment.id;
  const catalogSlug = establishment.catalog_slug || establishment.slug;
  const sourceAppName = establishment?.source_app?.name || establishment?.source_app?.slug || "Peter Tecnet";
  const availability = establishment?.availability || {};
  const publicCatalog = catalogActive && availability?.is_public !== false;
  const privatePreview = catalogActive && availability?.viewer?.can_preview === true && !publicCatalog;

  const imageCandidates = useMemo(() => {
    const files = Array.isArray(establishment.catalog_files) && establishment.catalog_files.length
      ? establishment.catalog_files
      : (Array.isArray(establishment.files) ? establishment.files : []);
    return [
      establishment?.images?.logo,
      establishment.logo,
      files.find((file) => file.type === "logo")?.public_url,
      establishment?.images?.background,
      files.find((file) => file.type === "background")?.public_url,
      files[0]?.public_url,
    ];
  }, [establishment]);

  const location = [establishment.city, establishment.uf].filter(Boolean).join(" - ");
  const openPresentation = () => {
    if (!catalogActive || !catalogSlug) return;
    navigate(`/establishment/view/${catalogSlug}${privatePreview ? "?preview=1" : ""}`);
  };

  const effectiveEstablishment = { ...establishment, id: catalogId, slug: catalogSlug };
  const statusLabel = !catalogActive
    ? "sem catálogo"
    : publicCatalog
      ? "público"
      : availability?.reason === "pending_approval"
        ? "aguardando publicação"
        : "oculto";

  return (
    <article className={`company-card ${catalogActive ? "is-catalog-active" : "is-catalog-available"}`} data-card-kind="establishment">
      <button type="button" className="company-card__visual" onClick={openPresentation} aria-label={catalogActive ? `${privatePreview ? "Pré-visualizar" : "Ver apresentação de"} ${name}` : `${name} ainda não possui catálogo Nexus`} disabled={!catalogActive}>
        <EntityImage src={imageCandidates} name={name} alt={name} shape="establishment" loading="lazy" />
        <span className="company-card__entity-badge"><i className="fas fa-building" aria-hidden="true" /> Empresa</span>
        <span className={`company-card__status ${publicCatalog ? "is-active" : "is-available"}`}><span className="company-card__status-dot" />{statusLabel}</span>
      </button>

      <div className="company-card__body">
        <div className="company-card__kind-row"><span className="company-card__kind-icon"><i className="fas fa-layer-group" /></span><span><strong>{catalogActive ? "Catálogo Nexus" : "Empresa disponível"}</strong><small>Origem: {sourceAppName}</small></span></div>
        <div className="company-card__title-row">
          <div className="company-card__title-wrap"><h2 title={name}>{name}</h2>{location && <span className="company-card__location"><i className="fas fa-location-dot" aria-hidden="true" /> {location}</span>}</div>
          {catalogActive && <button type="button" className="company-card__quick-open" onClick={openPresentation} aria-label={privatePreview ? "Abrir pré-visualização privada" : "Ver apresentação da empresa"} title={privatePreview ? "Pré-visualizar" : "Ver apresentação"}><i className={privatePreview ? "fas fa-eye" : "fas fa-arrow-up-right-from-square"} aria-hidden="true" /></button>}
        </div>
        {establishment.description && <p className="company-card__description">{establishment.description.length > 105 ? `${establishment.description.slice(0, 105).trim()}…` : establishment.description}</p>}
        {privatePreview && <div className="company-card__visibility-note"><i className="fas fa-eye-slash" aria-hidden="true" /><span>Oculto para visitantes. A prévia privada mostra exatamente como o perfil ficará quando for publicado.</span></div>}
        {catalogActive ? <EstablishmentActionsBar establishment={effectiveEstablishment} onDelete={onDelete} deleting={deleting} /> : <div className="company-card__activate-wrap"><button type="button" className="company-card__activate" onClick={() => onActivate?.(establishment)} disabled={activating}><i className={activating ? "fas fa-circle-notch fa-spin" : "fas fa-qrcode"} aria-hidden="true" />{activating ? "Criando catálogo…" : "Criar catálogo na Nexus"}</button></div>}
      </div>
    </article>
  );
}

EstablishmentDashboard.propTypes = {
  establishment: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
  onActivate: PropTypes.func,
  activating: PropTypes.bool,
};
EstablishmentDashboard.defaultProps = { deleting: false, onActivate: null, activating: false };
