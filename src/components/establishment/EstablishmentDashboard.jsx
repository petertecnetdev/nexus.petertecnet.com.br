// src/components/establishment/EstablishmentDashboard.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import useImageUtils from "../../hooks/useImageUtils";
import EstablishmentActionsBar from "./EstablishmentActionsBar";
import "./EstablishmentDashboard.css";

export default function EstablishmentDashboard({ establishment, navigate, onDelete, deleting }) {
  const { imageUrl } = useImageUtils();
  const name = establishment.fantasy || establishment.name || "Empresa";

  const image = useMemo(() => {
    const files = Array.isArray(establishment.files) ? establishment.files : [];
    const logo =
      establishment?.images?.logo ||
      establishment.logo ||
      files.find((file) => file.type === "logo")?.public_url ||
      files.find((file) => file.type === "background")?.public_url;
    return imageUrl(logo) || "/images/logo.png";
  }, [establishment, imageUrl]);

  const location = [establishment.city, establishment.uf].filter(Boolean).join(" - ");

  return (
    <article className="company-card" data-card-kind="establishment">
      <button
        type="button"
        className="company-card__visual"
        onClick={() => navigate(`/catalog/${establishment.slug}`)}
        aria-label={`Abrir catálogo de ${name}`}
      >
        <img src={image} alt={name} loading="lazy" />
        <span className="company-card__entity-badge">
          <i className="fas fa-building" aria-hidden="true" />
          Estabelecimento
        </span>
        <span className="company-card__status">
          <span className="company-card__status-dot" /> catálogo
        </span>
      </button>

      <div className="company-card__body">
        <div className="company-card__kind-row" aria-hidden="true">
          <span className="company-card__kind-icon">
            <i className="fas fa-store" />
          </span>
          <span>
            <strong>Empresa</strong>
            <small>contém catálogo e itens</small>
          </span>
        </div>

        <div className="company-card__title-row">
          <div className="company-card__title-wrap">
            <h2 title={name}>{name}</h2>
            {location && (
              <span className="company-card__location">
                <i className="fas fa-location-dot" aria-hidden="true" /> {location}
              </span>
            )}
          </div>
          <button
            type="button"
            className="company-card__quick-open"
            onClick={() => navigate(`/catalog/${establishment.slug}`)}
            aria-label="Abrir catálogo"
            title="Abrir catálogo"
          >
            <i className="fas fa-arrow-up-right-from-square" aria-hidden="true" />
          </button>
        </div>

        {establishment.description && (
          <p className="company-card__description">
            {establishment.description.length > 105
              ? `${establishment.description.slice(0, 105).trim()}…`
              : establishment.description}
          </p>
        )}

        <EstablishmentActionsBar
          establishment={establishment}
          onDelete={onDelete}
          deleting={deleting}
        />
      </div>
    </article>
  );
}

EstablishmentDashboard.propTypes = {
  establishment: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  deleting: PropTypes.bool,
};

EstablishmentDashboard.defaultProps = {
  deleting: false,
};
