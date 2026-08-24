import React from "react";
import { Card, Badge } from "react-bootstrap";
import useImageUtils from "../../hooks/useImageUtils";

export default function HomeSpotlight({ item, fmtBRL, navigate }) {
  const { imageUrl, handleImgError } = useImageUtils("/images/logo.png");

  const img =
    item.type === "employer"
      ? item.user?.avatar
      : item.type === "establishment"
      ? item.logo
      : item.image;

  const go = () => {
    if (item.type === "employer")
      return navigate(`/employer/view/${item.user.user_name}`);
    if (item.type === "establishment")
      return navigate(`/establishment/view/${item.slug}`);
    return navigate(`/item/view/${item.slug}`);
  };

  return (
    <Card bg="dark" text="light" className="rounded-4 spotlight-card" onClick={go}>
      <Card.Body className="d-flex align-items-center gap-3">
        <img
          src={imageUrl(img)}
          onError={handleImgError}
          className="spotlight-image"
          alt={item.name}
        />

        <div className="flex-grow-1">
          <h5 className="fw-bold mb-1">{item.name}</h5>

          {"price" in item && (
            <div className="mb-2">{fmtBRL(item.price)}</div>
          )}

          <Badge bg="warning" text="dark" className="px-3 py-2 rounded-pill">
            Destaque do Dia
          </Badge>
        </div>
      </Card.Body>
    </Card>
  );
}
