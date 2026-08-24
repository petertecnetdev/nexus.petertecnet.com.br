import React from "react";
import { Card, Row, Col } from "react-bootstrap";
import ItemListCard from "./ItemListCard";
import "./ItemListSection.css";

export default function ItemListSection({
  title,
  items,
  fmtPrice,
  ph,
  imageUrl,
  handleImgError,
  onDelete,
}) {
  if (!items || !items.length) return null;

  return (
    <Card bg="dark" text="light" className="mb-4">
      <Card.Header className="bg-dark text-light">
        <strong>{title}</strong>
      </Card.Header>

      <Card.Body>
        <Row className="gx-3 gy-3">
          {items.map((item) => (
            <Col key={item.id} md={3}>
              <ItemListCard
                item={item}
                fmtPrice={fmtPrice}
                ph={ph}
                imageUrl={imageUrl}
                handleImgError={handleImgError}
                onDelete={onDelete}
              />
            </Col>
          ))}
        </Row>
      </Card.Body>
    </Card>
  );
}
