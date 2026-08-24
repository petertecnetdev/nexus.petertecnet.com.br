import React from "react";
import { Badge } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import { storageUrl } from "../../config";
import "./HomeCard.css";

const parseSegments = (segments) => {
  if (Array.isArray(segments)) return segments;
  try {
    const parsed = JSON.parse(segments);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export default function HomeCard({ shop, onClick }) {
  const bg = shop.background ? `${storageUrl}/${shop.background}` : "/images/default-bg.png";
  const logo = shop.logo ? `${storageUrl}/${shop.logo}` : "/images/logo.png";
  const segs = parseSegments(shop.segments);

  return (
    <article
      className="hp-card"
      role="button"
      tabIndex={0}
      style={{ backgroundImage: `url("${bg}")` }}
      onClick={() => onClick(shop.slug)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onClick(shop.slug)}
      aria-label={`Abrir ${shop.name}`}
    >
      <div className="hp-hero-overlay" />
      <div className="hp-logo-bubble" aria-hidden="true">
        <img
          src={logo}
          alt=""
          className="hp-logo-img"
          draggable={false}
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = "/images/logo.png";
          }}
        />
      </div>
      <div className="hp-info">
        <h3 className="hp-name">{shop.name}</h3>
        {(shop.address || shop.city) && (
          <div className="hp-address">
            <FaMapMarkerAlt /> {shop.city && ` ${shop.city}`}
          </div>
        )}
        {segs.length > 0 && (
          <div className="hp-badges">
            {segs.map((seg) => (
              <Badge key={seg} bg="warning" text="dark">
                {seg}
              </Badge>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}
