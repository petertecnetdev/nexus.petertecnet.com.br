// src/components/establishment/EstablishmentDashboard.jsx
import React from "react";
import PropTypes from "prop-types";
import { Row, Col } from "react-bootstrap";
import GlobalCard from "../GlobalCard";
import EstablishmentActionsBar from "./EstablishmentActionsBar";
import "./EstablishmentDashboard.css";

export default function EstablishmentDashboard({ establishment, navigate }) {
  return (
    <div className="establishment-dashboard">
      <div className="establishment-dashboard-row">
        <div className="establishment-dashboard-card">
          <GlobalCard
            item={{ ...establishment, type: "establishment" }}
            navigate={navigate}
            showSchedule={false}
          />
        </div>

        <div className="establishment-dashboard-actions">
          <EstablishmentActionsBar establishment={establishment} />
        </div>
      </div>
    </div>
  );
}

EstablishmentDashboard.propTypes = {
  establishment: PropTypes.object.isRequired,
  navigate: PropTypes.func.isRequired,
};
