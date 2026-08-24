import React from "react";
import { Card, Button, Badge } from "react-bootstrap";
import { Link } from "react-router-dom";
import "./ItemCard.css";

export default function ItemCard({ item, imageUrl, fmtPrice, handleImgError, onDelete }) {
  return (
    <Card className="iteml-card h-100" bg="black" text="light">
      <div className="iteml-media-wrap">
        <img
          src={imageUrl(item.image)}
          alt={item.name}
          className="iteml-media"
          loading="lazy"
          onError={handleImgError}
        />
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
