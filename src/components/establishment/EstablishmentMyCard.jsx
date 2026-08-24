// src/components/establishment/EstablishmentMyCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import { storageUrl } from "../../config";
import EstablishmentActionsBar from "./EstablishmentActionsBar";
import EstablishmentTodaySnapshot from "./EstablishmentTodaySnapshot";

export default function EstablishmentMyCard({ establishment, metrics }) {
  const handleLogoError = (e) => {
    e.target.onerror = null;
    e.target.src = "/images/logo.png";
  };

  return (
    <Card className="dashboard-establishment-card h-100">
      <Card.Body>
        <div className="dashboard-establishment-header mb-3">
          <img
            src={`${storageUrl}/${establishment.logo || "logo.png"}`}
            alt={establishment.name}
            className="dashboard-establishment-logo"
            onError={handleLogoError}
          />
          <div>
            <div className="dashboard-establishment-name">
              {establishment.name}
            </div>
            <div className="dashboard-establishment-slug">
              @{establishment.slug}
            </div>
            <Button
              as={Link}
              to={`/establishment/view/${establishment.slug}`}
              size="sm"
              className="dashboard-establishment-btn mx-1 bg-black"
            >
              Página
            </Button>
          </div>
        </div>

        <EstablishmentActionsBar establishment={establishment} />
        <EstablishmentTodaySnapshot metrics={metrics} />
      </Card.Body>
    </Card>
  );
}

EstablishmentMyCard.propTypes = {
  establishment: PropTypes.shape({
    id: PropTypes.number.isRequired,
    slug: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    logo: PropTypes.string,
  }).isRequired,
  metrics: PropTypes.shape({
    totalOrders: PropTypes.number,
    totalValue: PropTypes.string,
    mostOrderedItem: PropTypes.string,
    topCustomer: PropTypes.string,
    avgOrdersPerHour: PropTypes.string,
    avgTicket: PropTypes.string,
  }),
};
