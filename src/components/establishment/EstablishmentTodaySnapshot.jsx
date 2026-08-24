// src/components/establishment/EstablishmentTodaySnapshot.jsx
import React from "react";
import PropTypes from "prop-types";
import { Row, Col, Card } from "react-bootstrap";

export default function EstablishmentTodaySnapshot({ metrics }) {
  const m = metrics || {};

  return (
    <Card bg="dark" text="light" className="mb-2">
      <Card.Header className="bg-dark text-light">
        <strong>Retrato de hoje</strong>
      </Card.Header>
      <Card.Body className="p-2">
        <Row className="mb-3 text-center">
          <Col md={2}>
            <Card bg="black" text="light" className="mb-2">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Atendimentos</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  {m.totalOrders || 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card bg="black" text="light" className="mb-2">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Faturamento</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  R{String.fromCharCode(36)}
                  {(m.totalValue || "0.00").replace(".", ",")}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="black" text="light" className="mb-2">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Mais pedido</Card.Title>
                <Card.Text className="fs-6 fw-bold">
                  {m.mostOrderedItem}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card bg="black" text="light" className="mb-2">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Cliente top</Card.Title>
                <Card.Text className="fs-6 fw-bold">
                  {m.topCustomer}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card bg="black" text="light" className="mb-2">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Média/hora</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  {m.avgOrdersPerHour}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
          <Col md={2}>
            <Card bg="black" text="light" className="mb-2">
              <Card.Body className="p-2">
                <Card.Title className="fs-6">Ticket médio</Card.Title>
                <Card.Text className="fs-5 fw-bold">
                  R{String.fromCharCode(36)}
                  {(m.avgTicket || "0.00").replace(".", ",")}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
}

EstablishmentTodaySnapshot.propTypes = {
  metrics: PropTypes.shape({
    totalOrders: PropTypes.number,
    totalValue: PropTypes.string,
    mostOrderedItem: PropTypes.string,
    topCustomer: PropTypes.string,
    avgOrdersPerHour: PropTypes.string,
    avgTicket: PropTypes.string,
  }),
};
