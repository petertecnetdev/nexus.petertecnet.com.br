// src/components/GlobalHero.jsx
import React from "react";
import PropTypes from "prop-types";
import { Container, Row, Col } from "react-bootstrap";
import {
  FaCalendarAlt,
  FaWhatsapp,
  FaMapMarkerAlt,
  FaPhoneAlt,
  FaUsers,
  FaBox,
  FaChartLine,
  FaEye,
} from "react-icons/fa";
import GlobalButton from "./GlobalButton";
import "./GlobalHero.css";

const PLACEHOLDER = "/images/logo.png";

export default function GlobalHero({
  entity = "generic",
  title,
  description,
  background,
  logo,
  imageUrl,
  handleImgError,
  whatsappLink,
  onScheduleClick,
  establishment,
  metrics,
  ordersSummary,
}) {
  const resolvedBackground =
    background ||
    establishment?.background ||
    establishment?.cover ||
    null;

  const bg = resolvedBackground ? imageUrl(resolvedBackground) : null;
  const logoImg = logo
    ? imageUrl(logo)
    : establishment?.logo
    ? imageUrl(establishment.logo)
    : PLACEHOLDER;

  return (
    <section
      className="gh2-root"
      style={bg ? { backgroundImage: `url(${bg})` } : undefined}
    >
      <div className="gh2-overlay" />

      <Container className="gh2-container">
        <Row className="align-items-center">
          <Col lg={3} md={4} className="text-center">
            <div className="gh2-logo-wrapper">
              <img
                src={logoImg}
                alt={title}
                onError={handleImgError}
                className="gh2-logo"
              />
            </div>
          </Col>

          <Col lg={6} md={8}>
            <h1 className="gh2-title">{title}</h1>

            {description && <p className="gh2-desc">{description}</p>}

            <div className="gh2-meta">
              {establishment?.city && (
                <span>
                  <FaMapMarkerAlt />
                  {establishment.city} - {establishment.uf}
                </span>
              )}

              {establishment?.phone && (
                <span>
                  <FaPhoneAlt />
                  {establishment.phone}
                </span>
              )}

              {establishment?.items_count !== undefined && (
                <span>
                  <FaBox />
                  {establishment.items_count} itens
                </span>
              )}

              {establishment?.employers_count !== undefined && (
                <span>
                  <FaUsers />
                  {establishment.employers_count} profissionais
                </span>
              )}
            </div>

            <div className="gh2-actions">
              {onScheduleClick && (
                <GlobalButton
                  variant="primary"
                  icon={<FaCalendarAlt />}
                  onClick={onScheduleClick}
                >
                  Agendar
                </GlobalButton>
              )}

              {whatsappLink && (
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noreferrer"
                  className="gh2-whatsapp"
                >
                  <FaWhatsapp />
                  WhatsApp
                </a>
              )}
            </div>
          </Col>

          <Col lg={3} className="d-none d-lg-block">
            <div className="gh2-stats">
              {metrics?.views !== undefined && (
                <div className="gh2-stat">
                  <FaEye />
                  <div>
                    <strong>{metrics.views}</strong>
                    <span>Visualizações</span>
                  </div>
                </div>
              )}

              {metrics?.unique_users !== undefined && (
                <div className="gh2-stat">
                  <FaUsers />
                  <div>
                    <strong>{metrics.unique_users}</strong>
                    <span>Usuários únicos</span>
                  </div>
                </div>
              )}

              {ordersSummary?.total_orders !== undefined && (
                <div className="gh2-stat">
                  <FaChartLine />
                  <div>
                    <strong>{ordersSummary.total_orders}</strong>
                    <span>Atendimentos</span>
                  </div>
                </div>
              )}
            </div>
          </Col>
        </Row>
      </Container>
    </section>
  );
}

GlobalHero.propTypes = {
  entity: PropTypes.string,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  background: PropTypes.string,
  logo: PropTypes.string,
  imageUrl: PropTypes.func.isRequired,
  handleImgError: PropTypes.func,
  whatsappLink: PropTypes.string,
  onScheduleClick: PropTypes.func,
  establishment: PropTypes.object,
  metrics: PropTypes.object,
  ordersSummary: PropTypes.object,
};
