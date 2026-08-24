// src/components/item/ItemListCard.jsx
import React, { useMemo } from "react";
import PropTypes from "prop-types";
import { Card, Badge } from "react-bootstrap";
import GlobalButton from "../GlobalButton";
import useImageUtils from "../../hooks/useImageUtils";
import "./ItemListCard.css";

export default function ItemListCard({ item, onEdit, onDelete, fmtPrice }) {
  const { imageUrl } = useImageUtils();

  const cover = useMemo(() => {
    const paths = [
      item?.images?.avatar,
      item?.images?.logo,
      item?.images?.background,
      Array.isArray(item?.images?.gallery) ? item.images.gallery[0] : null,
      item?.image,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [item, imageUrl]);

  const initials = useMemo(() => {
    if (!item?.name) return "?";
    const parts = item.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0].toUpperCase();
    return (
      parts[0][0].toUpperCase() +
      parts[parts.length - 1][0].toUpperCase()
    );
  }, [item]);

  return (
    <Card className="itemlist-card h-100 bg-dark text-light">
      <div className="itemlist-card-image-wrapper">
        {cover ? (
          <img
            src={cover}
            alt={item.name}
            className="itemlist-card-image"
          />
        ) : (
          <div className="itemlist-card-placeholder">{initials}</div>
        )}
      </div>

      <Card.Body className="d-flex flex-column">
        <Card.Title className="itemlist-card-title">
          {item.name}
        </Card.Title>

        <div className="d-flex align-items-center justify-content-between mb-2">
          <Badge bg="warning" text="dark">
            {item.type || "item"}
          </Badge>

          {item.price !== undefined && item.price !== null && (
            <span className="itemlist-card-price">
              {fmtPrice(item.price)}
            </span>
          )}
        </div>

        {item.status !== undefined && (
          <div className="mb-2">
            <Badge bg={item.status ? "success" : "secondary"}>
              {item.status ? "Ativo" : "Inativo"}
            </Badge>
          </div>
        )}

        {typeof item.total_views === "number" && (
          <div className="mb-2 small text-muted">
            {item.total_views} visualizações
          </div>
        )}

        <div className="mt-auto d-flex gap-2">
          <GlobalButton
            variant="outline"
            size="sm"
            full
            onClick={() => onEdit && onEdit(item)}
          >
            Editar
          </GlobalButton>

          <GlobalButton
            variant="danger"
            size="sm"
            full
            onClick={() => onDelete && onDelete(item)}
          >
            Excluir
          </GlobalButton>
        </div>
      </Card.Body>
    </Card>
  );
}

ItemListCard.propTypes = {
  item: PropTypes.shape({
    id: PropTypes.number,
    name: PropTypes.string,
    type: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    status: PropTypes.oneOfType([PropTypes.bool, PropTypes.number]),
    total_views: PropTypes.number,
    image: PropTypes.string,
    images: PropTypes.object,
  }).isRequired,
  onEdit: PropTypes.func,
  onDelete: PropTypes.func,
  fmtPrice: PropTypes.func,
};

ItemListCard.defaultProps = {
  onEdit: null,
  onDelete: null,
  fmtPrice: (v) =>
    Number(v || 0).toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    }),
};
