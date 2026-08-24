// src/components/order/OrderSelectedEmployerCard.jsx
import { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import { Card } from "react-bootstrap";
import useImageUtils from "../../hooks/useImageUtils";
import GlobalButton from "../GlobalButton";

export default function OrderSelectedEmployerCard({ employer, onClear }) {
  const { imageUrl } = useImageUtils();
  const [broken, setBroken] = useState(false);

  const safeEmployer = employer || {};
  const user = safeEmployer.user || {};

  const safeItem = useMemo(
    () => ({
      ...user,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
      avatar: user.avatar,
      images: user.images || null,
    }),
    [user]
  );

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
      safeItem.avatar,
      safeItem.images?.avatar,
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

  const getInitials = useCallback(() => {
    if (!safeItem.name) return "?";
    const parts = safeItem.name.split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() +
          parts.at(-1)[0].toUpperCase();
  }, [safeItem]);

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
        <rect width="200" height="200" rx="100" ry="100" fill="url(#g)" />
        <text
          x="50%"
          y="54%"
          text-anchor="middle"
          dominant-baseline="middle"
          font-size="72"
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

  if (!employer) return null;

  return (
    <Card className="mt-3">
      <Card.Body className="d-flex align-items-center gap-3">
        <img
          src={image && !broken ? image : placeholderSvg}
          alt={safeItem.name}
          loading="lazy"
          onError={() => setBroken(true)}
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />

        <div className="flex-grow-1">
          <div className="fw-semibold">{safeItem.name}</div>

          {user.email && (
            <div className="text-muted small">{user.email}</div>
          )}
        </div>

        <GlobalButton
          type="button"
          size="sm"
          variant="outline-danger"
          onClick={onClear}
        >
          Remover
        </GlobalButton>
      </Card.Body>
    </Card>
  );
}

OrderSelectedEmployerCard.propTypes = {
  employer: PropTypes.object,
  onClear: PropTypes.func.isRequired,
};
