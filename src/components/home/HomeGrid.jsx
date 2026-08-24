import React from "react";
import { Row, Col } from "react-bootstrap";
import HomeCard from "./HomeCard";
import HomeSkeletonCard from "./HomeSkeletonCard";

export default function HomeGrid({ loading, error, items, onClick }) {
  if (loading)
    return (
      <Row className="hp-grid">
        {[...Array(4)].map((_, i) => (
          <Col key={i} md={6} lg={4} xl={3} className="hp-col">
            <HomeSkeletonCard />
          </Col>
        ))}
      </Row>
    );

  if (error) return <div className="hp-empty">{error}</div>;
  if (items.length === 0) return <div className="hp-empty">Nenhuma barbearia encontrada.</div>;

  return (
    <Row className="hp-grid">
      {items.map((shop) => (
        <Col key={shop.id} md={6} lg={4} xl={3} className="hp-col mt-4">
          <HomeCard shop={shop} onClick={onClick} />
        </Col>
      ))}
    </Row>
  );
}
