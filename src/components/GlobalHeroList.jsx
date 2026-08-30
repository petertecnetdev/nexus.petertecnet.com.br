// src/components/GlobalHeroList.jsx
import React from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import GlobalButton from "./GlobalButton";
import EntityImage from "./EntityImage";
import useImageUtils from "../hooks/useImageUtils";
import "./GlobalHeroList.css";

export default function GlobalHeroList({ logo, background, title, subtitle, description, metrics = [], imageName, showBack = true }) {
  const navigate = useNavigate();
  const { imageUrl } = useImageUtils();
  const bg = imageUrl(background);
  const fallbackName = imageName || subtitle || title;

  return (
    <div className="ghlist-root" style={bg ? { backgroundImage: `linear-gradient(rgba(0,0,0,0.65), rgba(0,0,0,0.85)), url("${bg}")` } : undefined}>
      <div className="ghlist-inner">
        {showBack && <div className="ghlist-back"><GlobalButton size="md" variant="outline" onClick={() => navigate(-1)}>Voltar</GlobalButton></div>}
        <div className="ghlist-logo-box">
          <EntityImage src={logo} name={fallbackName} alt={fallbackName} shape="establishment" className="ghlist-logo" loading="lazy" />
        </div>
        <h1 className="ghlist-title">{title}</h1>
        {subtitle && <p className="ghlist-subtitle">{subtitle}</p>}
        {description && <p className="ghlist-description">{description}</p>}
        {Array.isArray(metrics) && metrics.length > 0 && <div className="ghlist-metrics-box">{metrics.map((m, idx) => <React.Fragment key={`${m.label || "metric"}-${idx}`}><div className="ghlist-metric"><div className="ghlist-metric-value">{m.value ?? 0}</div><div className="ghlist-metric-label">{m.label}</div></div>{idx < metrics.length - 1 && <div className="ghlist-separator" />}</React.Fragment>)}</div>}
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
  imageName: PropTypes.string,
  imageUrl: PropTypes.func,
  handleImgError: PropTypes.func,
  showBack: PropTypes.bool,
};
