import { useRef, useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Badge } from "react-bootstrap";
import { FaMapMarkerAlt } from "react-icons/fa";
import useImageUtils from "../hooks/useImageUtils";
import GlobalButton from "./GlobalButton";
import "./GlobalCard.css";

const hasPrice = (value) =>
  value !== null && value !== undefined && value !== "" && Number.isFinite(Number(value));

export default function GlobalCard({ item, fmtBRL, navigate, actions }) {
  const { imageUrl, handleImgError: baseHandleImgError } = useImageUtils();
  const cardRef = useRef(null);
  const [broken, setBroken] = useState(false);
  const safeItem = item || {};
  const establishment = safeItem.establishment || {};

  const handleImgError = (event) => {
    baseHandleImgError(event);
    setBroken(true);
  };

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
      safeItem.image_url,
      safeItem.avatar,
      safeItem.files?.find?.((file) => file.type === "image")?.public_url,
      safeItem.images?.cover,
      safeItem.images?.main,
      safeItem.images?.avatar,
      safeItem.images?.logo,
      safeItem.images?.background,
      Array.isArray(safeItem.images?.gallery) ? safeItem.images.gallery[0] : null,
    ];
    for (const path of paths) {
      const url = imageUrl(path);
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
    for (const path of paths) {
      const url = imageUrl(path);
      if (url) return url;
    }
    return null;
  }, [establishment, imageUrl]);

  const getInitials = useCallback(() => {
    if (!safeItem.name) return "?";
    const parts = safeItem.name.trim().split(/\s+/).filter(Boolean);
    if (!parts.length) return "?";
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : `${parts[0][0]}${parts.at(-1)[0]}`.toUpperCase();
  }, [safeItem.name]);

  const handleDetails = () => {
    if (typeof navigate !== "function" || !safeItem.slug) return;
    if (safeItem.type === "establishment") {
      navigate(`/catalog/${safeItem.slug}`);
      return;
    }
    navigate(`/item/view/${safeItem.slug}`);
  };

  const handleEstablishmentClick = (event) => {
    event.stopPropagation();
    if (typeof navigate !== "function" || !establishment?.slug) return;
    navigate(`/catalog/${establishment.slug}`);
  };

  const isEstablishment = safeItem.type === "establishment";

  const placeholderSvg = useMemo(() => {
    const initials = getInitials();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#0b1c2d"/><stop offset="100%" stop-color="#020617"/></linearGradient></defs><rect width="200" height="200" rx="18" fill="url(#g)"/><text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle" font-size="64" font-weight="700" fill="#e5e7eb" font-family="Inter,Arial,sans-serif">${initials}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [getInitials]);

  if (!item) return null;

  return (
    <div
      ref={cardRef}
      className={`carousel-card hologram-container type-${safeItem.type || "item"} ${isEstablishment ? "establishment-horizontal" : ""}`}
    >
      <div
        className={`carousel-image-wrap ${isEstablishment ? "img-establishment" : "img-square"}`}
        onClick={handleDetails}
        onKeyDown={(event) => {
          if ((event.key === "Enter" || event.key === " ") && navigate) handleDetails();
        }}
        role={navigate ? "button" : undefined}
        tabIndex={navigate ? 0 : undefined}
      >
        <img
          src={image && !broken ? image : placeholderSvg}
          alt={safeItem.name || "Item"}
          loading="lazy"
          className="carousel-image"
          onError={handleImgError}
        />
      </div>

      <div className="carousel-item-content">
        <div
          className="carousel-item-name"
          onClick={handleDetails}
          onKeyDown={(event) => {
            if ((event.key === "Enter" || event.key === " ") && navigate) handleDetails();
          }}
          role={navigate ? "button" : undefined}
          tabIndex={navigate ? 0 : undefined}
        >
          {safeItem.name}
        </div>

        {!isEstablishment && establishment?.name && (
          <div
            className="globalcard-establishment d-flex align-items-center gap-2 mt-1"
            role="button"
            tabIndex={0}
            onClick={handleEstablishmentClick}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") handleEstablishmentClick(event);
            }}
          >
            {establishmentLogo && (
              <img
                src={establishmentLogo}
                alt={`Logo de ${establishment.name}`}
                className="globalcard-establishment-logo"
                onError={handleImgError}
                loading="lazy"
              />
            )}
            <span className="globalcard-establishment-name">{establishment.name}</span>
          </div>
        )}

        {(safeItem.city || safeItem.uf) && (
          <div className="globalcard-location d-flex align-items-center gap-1 mt-1">
            <FaMapMarkerAlt size={12} className="text-warning" aria-hidden="true" />
            <span className="text-light-50">{safeItem.city}{safeItem.uf ? ` - ${safeItem.uf}` : ""}</span>
          </div>
        )}

        {hasPrice(safeItem.price) && (
          <div className="carousel-item-price">{fmtBRL(safeItem.price)}</div>
        )}

        {safeItem.description && !isEstablishment && (
          <div className="text-light-50 small mt-1">
            {safeItem.description.length > 110
              ? `${safeItem.description.slice(0, 110).trim()}…`
              : safeItem.description}
          </div>
        )}

        <div className="d-flex flex-wrap gap-2 mt-2">
          {safeItem.category && <Badge bg="secondary">{safeItem.category}</Badge>}
          {safeItem.brand && <Badge bg="secondary">{safeItem.brand}</Badge>}
        </div>

        {navigate && safeItem.slug && (
          <div className="mt-2">
            <GlobalButton type="button" size="sm" variant="outline" stopPropagation className="px-4" onClick={handleDetails}>
              Detalhes
            </GlobalButton>
          </div>
        )}

        {actions && <div className="mt-3 establishment-actions-slot">{actions}</div>}
      </div>
    </div>
  );
}

GlobalCard.propTypes = {
  item: PropTypes.object,
  fmtBRL: PropTypes.func,
  navigate: PropTypes.func,
  actions: PropTypes.node,
};

GlobalCard.defaultProps = {
  fmtBRL: (value) => value,
};
