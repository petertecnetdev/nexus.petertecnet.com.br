// src/components/establishment/EstablishmentActionsBar.jsx
import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function EstablishmentActionsBar({ establishment }) {
  const catalogUrl = `/catalog/${establishment.slug}`;

  return (
    <Card bg="dark" text="light" className="m-2">
      <Card.Body className="p-2">
        <Row className="gx-2 gy-2 text-center">
          <Col xs={12} md={3}>
            <Button as={Link} to={catalogUrl} size="sm" className="dashboard-establishment-btn bg-black w-100">
              Ver catálogo
            </Button>
          </Col>
          <Col xs={12} md={3}>
            <Button as={Link} to={`/establishment/item/${establishment.slug}`} size="sm" className="dashboard-establishment-btn bg-black w-100">
              Gerenciar itens
            </Button>
          </Col>
          <Col xs={12} md={3}>
            <Button as={Link} to={`${catalogUrl}#compartilhar`} size="sm" className="dashboard-establishment-btn bg-black w-100">
              QR / Compartilhar
            </Button>
          </Col>
          <Col xs={12} md={3}>
            <Button as={Link} to={`/establishment/update/${establishment.id}`} size="sm" className="dashboard-establishment-btn bg-black w-100">
              Editar empresa
            </Button>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

EstablishmentActionsBar.propTypes = {
  establishment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
  }).isRequired,
};
