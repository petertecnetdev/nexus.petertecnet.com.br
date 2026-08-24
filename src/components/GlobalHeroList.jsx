// src/components/GlobalHeroList.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import GlobalButton from "./GlobalButton";
import "./GlobalHeroList.css";

export default function GlobalHeroList({
  logo,
  background,
  title,
  subtitle,
  description,
  metrics = [],
  imageUrl,
  handleImgError,
  showBack = true,
}) {
  const navigate = useNavigate();

  return (
    <div
      className="ghlist-root"
      style={{
        backgroundImage: `linear-gradient(
          rgba(0,0,0,0.65),
          rgba(0,0,0,0.85)
        ), url("${imageUrl(background)}")`,
      }}
    >
      <div className="ghlist-inner">
        {showBack && (
          <div className="ghlist-back">
            <GlobalButton
              size="md"
              variant="outline"
              onClick={() => navigate(-1)}
            >
              Voltar
            </GlobalButton>
          </div>
        )}

        {logo && (
          <div className="ghlist-logo-box">
            <img
              src={imageUrl(logo)}
              alt="Logo"
              className="ghlist-logo"
              onError={handleImgError}
            />
          </div>
        )}

        <h1 className="ghlist-title">{title}</h1>

        {subtitle && <p className="ghlist-subtitle">{subtitle}</p>}

        {description && (
          <p className="ghlist-description">{description}</p>
        )}

        {Array.isArray(metrics) && metrics.length > 0 && (
          <div className="ghlist-metrics-box">
            {metrics.map((m, idx) => (
              <React.Fragment key={idx}>
                <div className="ghlist-metric">
                  <div className="ghlist-metric-value">
                    {m.value ?? 0}
                  </div>
                  <div className="ghlist-metric-label">
                    {m.label}
                  </div>
                </div>
                {idx < metrics.length - 1 && (
                  <div className="ghlist-separator" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

GlobalHeroList.propTypes = {
  logo: PropTypes.string,
  background: PropTypes.string,
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  description: PropTypes.string,
  metrics: PropTypes.array,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func.isRequired,
  showBack: PropTypes.bool,
};

GlobalHeroList.defaultProps = {
  showBack: true,
};
