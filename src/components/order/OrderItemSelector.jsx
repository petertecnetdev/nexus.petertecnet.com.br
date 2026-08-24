// src/components/order/OrderItemSelector.jsx
import { useState, useMemo, useCallback } from "react";
import PropTypes from "prop-types";
import useImageUtils from "../../hooks/useImageUtils";
import "./OrderItemSelector.css";

function OrderItemCard({ item, selected, toggleItem, compact }) {
  const { imageUrl } = useImageUtils();
  const [broken, setBroken] = useState(false);

  const safeItem = useMemo(
    () => ({
      ...item,
      name: item.name || "Serviço",
      image: item.image,
      images: item.images || null,
    }),
    [item]
  );

  const image = useMemo(() => {
    const paths = [
      safeItem.image,
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
  }, [safeItem.name]);

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
        <rect width="200" height="200" rx="24" ry="24" fill="url(#g)" />
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

  return (
    <div
      className={`order-item-card ${selected ? "active" : ""} ${
        compact ? "compact" : ""
      }`}
      onClick={() => toggleItem(item)}
    >
      <div className="item-image">
        <img
          src={image && !broken ? image : placeholderSvg}
          alt={safeItem.name}
          loading="lazy"
          onError={() => setBroken(true)}
        />
      </div>

      <div className="item-info">
        <strong className="item-name">{safeItem.name}</strong>

        <div className="item-meta">
          <span className="item-price">
            R$ {Number(item.price || 0).toFixed(2).replace(".", ",")}
          </span>
          <small className="item-duration">
            {item.duration || 30} min
          </small>
        </div>
      </div>

      {selected && <div className="item-selected-badge">Selecionado</div>}
    </div>
  );
}

OrderItemCard.propTypes = {
  item: PropTypes.object.isRequired,
  selected: PropTypes.bool.isRequired,
  toggleItem: PropTypes.func.isRequired,
  compact: PropTypes.bool,
};

export default function OrderItemSelector({
  items,
  selectedItems,
  toggleItem,
  loading,
  compact = false,
}) {
  if (loading) {
    return <div className="order-items-loading">Carregando serviços...</div>;
  }

  return (
    <div className={`order-items-grid ${compact ? "compact" : ""}`}>
      {items.map((item) => (
        <OrderItemCard
          key={item.id}
          item={item}
          selected={!!selectedItems[item.id]}
          toggleItem={toggleItem}
          compact={compact}
        />
      ))}
    </div>
  );
}

OrderItemSelector.propTypes = {
  items: PropTypes.array.isRequired,
  selectedItems: PropTypes.object.isRequired,
  toggleItem: PropTypes.func.isRequired,
  loading: PropTypes.bool,
  compact: PropTypes.bool,
};

OrderItemSelector.defaultProps = {
  loading: false,
  compact: false,
};
