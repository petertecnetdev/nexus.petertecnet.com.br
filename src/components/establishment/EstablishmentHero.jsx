// src/components/establishment/EstablishmentHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import GlobalButton from "../GlobalButton";
import "./EstablishmentHero.css";

export default function EstablishmentHero({
  entity,
  logo,
  background,
  title,
  subtitle,
  description,
  city,
  uf,
  showBack,
}) {
  const navigate = useNavigate();

 const resolved = entity || {};

const finalLogo =
  logo ??
  resolved?.images?.logo ??
  resolved?.logo ??
  null;

const finalBackground =
  background ??
  resolved?.images?.background ??
  resolved?.background ??
  null;

const finalTitle = title ?? resolved.fantasy ?? resolved.name;
const finalDescription = description ?? resolved.description;
const finalCity = city ?? resolved.city;
const finalUf = uf ?? resolved.uf;


  return (
    <div
      className="eshlist-root"
      style={{
        backgroundImage: finalBackground
          ? `linear-gradient(
              rgba(0,0,0,0.65),
              rgba(0,0,0,0.85)
            ), url("${finalBackground}")`
          : undefined,
      }}
    >
      <div className="eshlist-inner">
        {showBack && (
          <div className="eshlist-back">
            <GlobalButton
              size="md"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Voltar
            </GlobalButton>
          </div>
        )}

        {finalLogo && (
          <div className="eshlist-logo-box">
            <img src={finalLogo} alt="Logo" className="eshlist-logo" />
          </div>
        )}

        {finalTitle && <h1 className="eshlist-title">{finalTitle}</h1>}

        {subtitle && <p className="eshlist-subtitle">{subtitle}</p>}

        {finalDescription && (
          <p className="eshlist-description">{finalDescription}</p>
        )}

        {(finalCity || finalUf) && (
          <div className="eshlist-location">
            {finalCity}
            {finalCity && finalUf ? " / " : ""}
            {finalUf}
          </div>
        )}
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

EstablishmentHero.defaultProps = {
  showBack: true,
};
