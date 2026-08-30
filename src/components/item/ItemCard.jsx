import React, { useMemo, useState } from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./ItemCard.css";

const getInitials = (name) => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export default function ItemCard({ item, imageUrl, fmtPrice, onDelete }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = imageUrl(item?.image);
  const initials = useMemo(() => getInitials(item?.name), [item?.name]);
  const showImage = Boolean(image) && !imageFailed;

  return (
    <Card className="iteml-card h-100" bg="black" text="light">
      <div className="iteml-media-wrap">
        {showImage ? (
          <img
            src={image}
            alt={item.name}
            className="iteml-media"
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="iteml-media iteml-media--initials" aria-label={`Sem foto: ${item.name || "item"}`}>
            {initials}
          </div>
        )}
      </div>

      <Card.Body className="p-3 d-flex flex-column">
        <div className="iteml-item-name">{item.name}</div>

        <div className="d-flex justify-content-between align-items-center mb-2">
          <div className="iteml-item-price">{fmtPrice(item.price)}</div>

          {item.duration && (
            <Badge bg="warning" text="dark">{item.duration} min</Badge>
          )}

          {item.stock !== undefined && item.stock !== null && (
            <Badge bg={Number(item.stock) > 0 ? "success" : "secondary"}>
              {Number(item.stock) > 0 ? "Em estoque" : "Indisponível"}
            </Badge>
          )}
        </div>

        {item.description && (
          <div className="iteml-item-desc mt-2">{item.description}</div>
        )}

        <div className="mt-3 d-flex gap-2">
          <Button as={Link} to={`/item/update/${item.id}`} variant="outline-warning" size="sm">
            Editar
          </Button>
          <Button variant="outline-danger" size="sm" onClick={() => onDelete(item)}>
            Excluir
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
}
