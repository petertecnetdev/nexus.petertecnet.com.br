import React from "react";
import { Card } from "react-bootstrap";

export default function EmployerKpiCard({ title, value }) {
  return (
    <Card className="kpi-card kpi-card--dark">
      <Card.Body>
        <div className="kpi-title">{title}</div>
        <div className="kpi-value">{value}</div>
      </Card.Body>
    </Card>
  );
}
