// src/components/establishment/EstablishmentActionsBar.jsx
import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";

export default function EstablishmentActionsBar({ establishment }) {
  return (
    <Card bg="dark" text="light" className="m-2">
      <Card.Body className="p-2">
        <Row className="gx-2 gy-2 text-center">
        
          <Col md={3}>
            <Button
              as={Link}
              to={`/establishment/orders/${establishment.slug}`}
              size="sm"
              className="dashboard-establishment-btn bg-black w-100"
            >
              📑 Pedidos
            </Button>
          </Col>
          <Col md={3}>
            <Button
              as={Link}
              to={`/establishment/employers/${establishment.slug}`}
              size="sm"
              className="dashboard-establishment-btn bg-black w-100"
            >
              👥 Colaboradores
            </Button>
          </Col>
          <Col md={3}>
            <Button
              as={Link}
               to={`/establishment/item/${establishment.slug}`}
              size="sm"
              className="dashboard-establishment-btn bg-black w-100"
            >
              Itens
            </Button>
          </Col>
          <Col md={2}>
            <Button
              as={Link}
              to={`/establishment/update/${establishment.id}`}
              size="sm"
              className="dashboard-establishment-btn bg-black w-100"
            >
              ✏️ Editar
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
