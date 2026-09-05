// src/components/establishment/EstablishmentHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import GlobalButton from "../GlobalButton";
import EntityImage from "../EntityImage";
import useImageUtils from "../../hooks/useImageUtils";
import {
  mediaUrl,
  resolveEstablishmentBackground,
  resolveEstablishmentLogo,
} from "../../utils/establishmentMedia";
import "./EstablishmentHero.css";

export default function EstablishmentHero({ entity, logo, background, title, subtitle, description, city, uf, showBack }) {
  const navigate = useNavigate();
  const { imageUrl } = useImageUtils();
  const resolved = entity || {};
  const finalLogo = mediaUrl(logo) || resolveEstablishmentLogo(resolved);
  const backgroundSource =
    mediaUrl(background) || resolveEstablishmentBackground(resolved, null, finalLogo);
  const finalBackground = backgroundSource ? imageUrl(backgroundSource) : null;
  const finalTitle = title ?? resolved.fantasy ?? resolved.name ?? "Empresa";
  const finalDescription = description ?? resolved.description;
  const finalCity = city ?? resolved.city;
  const finalUf = uf ?? resolved.uf;

  return (
    <div
      className="eshlist-root"
      style={{
        backgroundImage: finalBackground
          ? `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url("${finalBackground}")`
          : undefined,
      }}
    >
      <div className="eshlist-inner">
        {showBack && <div className="eshlist-back"><GlobalButton size="md" variant="outline" onClick={() => navigate(-1)}>Voltar</GlobalButton></div>}

        <div className="eshlist-logo-box">
          <EntityImage src={finalLogo} name={finalTitle} alt={`Imagem de ${finalTitle}`} shape="establishment" className="eshlist-logo" />
        </div>

        {finalTitle && <h1 className="eshlist-title">{finalTitle}</h1>}
        {subtitle && <p className="eshlist-subtitle">{subtitle}</p>}
        {finalDescription && <p className="eshlist-description">{finalDescription}</p>}
        {(finalCity || finalUf) && <div className="eshlist-location">{finalCity}{finalCity && finalUf ? " / " : ""}{finalUf}</div>}
      </div>
    </div>
  );
}

EstablishmentHero.propTypes = {
  entity: PropTypes.object,
  logo: PropTypes.string,
  background: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  city: PropTypes.string,
  uf: PropTypes.string,
  showBack: PropTypes.bool,
};
EstablishmentHero.defaultProps = { showBack: true };
