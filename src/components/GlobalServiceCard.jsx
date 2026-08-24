// src/components/global/GlobalServiceCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";

const fmtBRL = (v) =>
  `R$ ${Number(v || 0).toFixed(2).replace(".", ",")}`;

export default function GlobalServiceCard({ service, onRemove }) {
  return (
    <Card bg="black" text="light" className="h-100">
      <Card.Body>
        <div className="d-flex justify-content-between">
          <strong>{service.name}</strong>
          <span>{fmtBRL(service.price)}</span>
        </div>
        <div className="small text-muted">
          {service.duration || 0} min
        </div>
        <Button
          size="sm"
          variant="outline-danger"
          className="mt-2 w-100"
          onClick={() => onRemove(service)}
        >
          Remover
        </Button>
      </Card.Body>
    </Card>
  );
}

GlobalServiceCard.propTypes = {
  service: PropTypes.object.isRequired,
  onRemove: PropTypes.func.isRequired,
};
