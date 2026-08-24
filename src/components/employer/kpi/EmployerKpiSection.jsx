import React from "react";
import { Row, Col } from "react-bootstrap";
import EmployerKpiCard from "./EmployerKpiCard";

export default function EmployerKpiSection({ summary, money }) {
  const cards = [
    { title: "Total de Atendimentos", value: summary.total },
    { title: "Hoje", value: summary.today },
    { title: "Amanhã", value: summary.tomorrow },
    { title: "Valor Total", value: `R$${money(summary.value)}` },
  ];

  return (
    <Row className="mb-4 text-center">
      {cards.map((card, i) => (
        <Col md={3} className="mb-2" key={i}>
          <EmployerKpiCard title={card.title} value={card.value} />
        </Col>
      ))}
    </Row>
  );
}
