// src/components/establishment/EstablishmentMyCard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Card, Button } from "react-bootstrap";
import { Link } from "react-router-dom";
import EntityImage from "../EntityImage";
import EstablishmentActionsBar from "./EstablishmentActionsBar";
import EstablishmentTodaySnapshot from "./EstablishmentTodaySnapshot";

export default function EstablishmentMyCard({ establishment, metrics }) {
  const name = establishment.fantasy || establishment.name || "Empresa";
  const files = Array.isArray(establishment.files) ? establishment.files : [];
  const images = [
    establishment?.images?.logo,
    establishment.logo,
    files.find((file) => file?.type === "logo")?.public_url,
    establishment?.images?.background,
    files.find((file) => file?.is_primary)?.public_url,
    files[0]?.public_url,
  ];

  return (
    <Card className="dashboard-establishment-card h-100">
      <Card.Body>
        <div className="dashboard-establishment-header mb-3">
          <EntityImage src={images} name={name} alt={name} shape="establishment" className="dashboard-establishment-logo" loading="lazy" />
          <div>
            <div className="dashboard-establishment-name">{name}</div>
            <div className="dashboard-establishment-slug">@{establishment.slug}</div>
            <Button as={Link} to={`/establishment/view/${establishment.slug}`} size="sm" className="dashboard-establishment-btn mx-1 bg-black">Página</Button>
          </div>
        </div>
        <EstablishmentActionsBar establishment={establishment} />
        <EstablishmentTodaySnapshot metrics={metrics} />
      </Card.Body>
    </Card>
  );
}

EstablishmentMyCard.propTypes = {
  establishment: PropTypes.shape({ id: PropTypes.number.isRequired, slug: PropTypes.string.isRequired, name: PropTypes.string.isRequired, fantasy: PropTypes.string, logo: PropTypes.string, files: PropTypes.array }),
  metrics: PropTypes.shape({ totalOrders: PropTypes.number, totalValue: PropTypes.string, mostOrderedItem: PropTypes.string, topCustomer: PropTypes.string, avgOrdersPerHour: PropTypes.string, avgTicket: PropTypes.string }),
};
