// src/components/home/HomeCarousels.jsx
import React from "react";
import { Col } from "react-bootstrap";
import GlobalCarousel from "../GlobalCarousel";
import "./HomeCarousels.css";

export default function HomeCarousels({
  navigate,
  fmtBRL,
  establishments,
  employers,
  services,
  products,
}) {
  return (
    <Col md={8} className="shotgun-left">
      {establishments.length > 0 && (
        <div className="shotgun-section">
          <h3 className="shotgun-section-title">Estabelecimentos</h3>
          <GlobalCarousel
            title="Estabelecimentos"
            items={establishments}
            fmtBRL={fmtBRL}
            navigate={navigate}
            openSchedulePopup={() => {}}
            showSchedule={false}
          />
        </div>
      )}

      {employers.length > 0 && (
        <div className="shotgun-section">
          <h3 className="shotgun-section-title">Profissionais</h3>
          <GlobalCarousel
            title="Profissionais"
            items={employers}
            fmtBRL={fmtBRL}
            navigate={navigate}
            openSchedulePopup={() => {}}
            showSchedule={false}
          />
        </div>
      )}

      {services.length > 0 && (
        <div className="shotgun-section">
          <h3 className="shotgun-section-title">Serviços</h3>
          <GlobalCarousel
            title="Serviços"
            items={services}
            fmtBRL={fmtBRL}
            navigate={navigate}
            openSchedulePopup={() => {}}
            showSchedule={false}
          />
        </div>
      )}

      {products.length > 0 && (
        <div className="shotgun-section">
          <h3 className="shotgun-section-title">Produtos</h3>
          <GlobalCarousel
            title="Produtos"
            items={products}
            fmtBRL={fmtBRL}
            navigate={navigate}
            openSchedulePopup={() => {}}
            showSchedule={false}
          />
        </div>
      )}
    </Col>
  );
}
