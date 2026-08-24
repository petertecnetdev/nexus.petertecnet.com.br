import { useRef, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import useImageUtils from "../hooks/useImageUtils";
import GlobalButton from "./GlobalButton";
import "./GlobalCard.css";

export default function GlobalCard({
  item,
  fmtBRL,
  navigate,
  showSchedule,
  openSchedulePopup,
  actions,
}) {
  const { imageUrl, handleImgError: baseHandleImgError } = useImageUtils();
  const cardRef = useRef(null);
  const [broken, setBroken] = useState(false);

  const safeItem = item || {};
  const establishment = safeItem.establishment || {};

  const handleImgError = (e) => {
    baseHandleImgError(e);
    setBroken(true);
  };

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
      safeItem.avatar,
      safeItem.images?.avatar,
      safeItem.images?.logo,
      safeItem.images?.background,
      Array.isArray(safeItem.images?.gallery)
        ? safeItem.images.gallery[0]
        : null,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [safeItem, imageUrl]);

  const establishmentLogo = useMemo(() => {
    const paths = [
      establishment?.images?.logo,
      establishment?.logo,
      establishment?.images?.background,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [establishment, imageUrl]);

  const getInitials = useCallback(() => {
    if (!safeItem.name) return "?";
    const parts = safeItem.name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() +
          parts.at(-1)[0].toUpperCase();
  }, [safeItem]);

  const getShape = useCallback(() => {
    if (safeItem.type === "employer") return "img-round";
    if (safeItem.type === "establishment") return "img-establishment";
    return "img-square";
  }, [safeItem]);

  const handleDetails = () => {
    if (!safeItem || typeof navigate !== "function") return;
    if (!safeItem.slug) return;

    if (safeItem.type === "establishment") {
      navigate(`/establishment/view/${safeItem.slug}`);
      return;
    }

    if (safeItem.type === "employer") {
      navigate(`/employer/view/${safeItem.slug}`);
      return;
    }

    navigate(`/item/view/${safeItem.slug}`);
  };

  const handleEstablishmentClick = (e) => {
    e.stopPropagation();
    if (!navigate || !establishment?.slug) return;
    navigate(`/establishment/view/${establishment.slug}`);
  };

  const shape = getShape();
  const isEstablishment = safeItem.type === "establishment";

  const placeholderSvg = useMemo(() => {
    const initials = getInitials();
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">
        <defs>
          <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#0b1c2d" />
            <stop offset="100%" stop-color="#020617" />
          </linearGradient>
        </defs>
        <rect width="200" height="200" rx="18" ry="18" fill="url(#g)" />
        <text
          x="50%"
          y="54%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="64"
          font-weight="700"
          fill="#e5e7eb"
          font-family="Inter, Arial, sans-serif"
          letter-spacing="2"
        >
          ${initials}
        </text>
      </svg>
    `;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [getInitials]);

  if (!item) return null;

  return (
    <div
      ref={cardRef}
      className={`carousel-card hologram-container type-${safeItem.type} ${
        isEstablishment ? "establishment-horizontal" : ""
      }`}
    >
      <div
        className={`carousel-image-wrap ${shape}`}
        onClick={handleDetails}
        role={navigate ? "button" : undefined}
      >
        <img
          src={image && !broken ? image : placeholderSvg}
          alt={safeItem.name}
          loading="lazy"
          className="carousel-image"
          onError={handleImgError}
        />
      </div>

      <div className="carousel-item-content">
        <div
          className="carousel-item-name"
          onClick={handleDetails}
          role={navigate ? "button" : undefined}
        >
          {safeItem.name}
        </div>

        {!isEstablishment && establishment?.name && (
          <div
            className="globalcard-establishment d-flex align-items-center gap-2 mt-1"
            role="button"
            onClick={handleEstablishmentClick}
          >
            {establishmentLogo && (
              <img
                src={establishmentLogo}
                alt={establishment.name}
                className="globalcard-establishment-logo"
                onError={handleImgError}
              />
            )}
            <span className="globalcard-establishment-name">
              {establishment.name}
            </span>
          </div>
        )}

        {(safeItem.city || safeItem.uf) && (
          <div className="globalcard-location d-flex align-items-center gap-1 mt-1">
            <FaMapMarkerAlt size={12} className="text-warning" />
            <span className="text-light-50">
              {safeItem.city}
              {safeItem.uf ? ` - ${safeItem.uf}` : ""}
            </span>
          </div>
        )}

        {safeItem.price !== undefined && (
          <div className="carousel-item-price">
            {fmtBRL(safeItem.price)}
          </div>
        )}

        {safeItem.duration !== null &&
          safeItem.duration !== undefined && (
            <div className="text-light-50 small mb-1">
              {safeItem.duration} min
            </div>
          )}

        <div className="d-flex flex-wrap gap-2 mt-2">
  {safeItem.metrics && (
    <>
      <Badge bg="secondary" className="px-2 py-1 rounded-pill">
        {safeItem.metrics.total_views ?? 0} Views
      </Badge>
      {'completed_orders' in safeItem.metrics && (
        <Badge bg="secondary" className="px-2 py-1 rounded-pill">
          {safeItem.metrics.completed_orders ?? 0} Pedidos
        </Badge>
      )}
    </>
  )}
</div>

        {navigate && (
          <div className="mt-2">
            <GlobalButton
              size="sm"
              variant="outline"
              stopPropagation
              className="px-4"
              onClick={handleDetails}
            >
              Detalhes
            </GlobalButton>
          </div>
        )}

        {showSchedule && typeof openSchedulePopup === "function" && (
          <GlobalButton
            size="sm"
            full
            variant="primary"
            stopPropagation
            onClick={() => openSchedulePopup(safeItem)}
            className="mt-2"
          >
            Agendar
          </GlobalButton>
        )}

        {actions && (
          <div className="mt-3 establishment-actions-slot">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

GlobalCard.propTypes = {
  item: PropTypes.object,
  fmtBRL: PropTypes.func,
  navigate: PropTypes.func,
  showSchedule: PropTypes.bool,
  openSchedulePopup: PropTypes.func,
  actions: PropTypes.node,
};

GlobalCard.defaultProps = {
  fmtBRL: (v) => v,
  showSchedule: false,
  openSchedulePopup: null,
};
