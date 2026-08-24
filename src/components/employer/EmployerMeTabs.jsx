// src/components/employer/EmployerMeTabs.jsx
import React from "react";
import { Button } from "react-bootstrap";
import PropTypes from "prop-types";
import "./EmployerMeTabs.css";

export default function EmployerMeTabs({ activeTab, onChange }) {
  return (
    <div className="d-flex gap-2 mb-4">
      <Button
        variant={activeTab === "schedules" ? "primary" : "outline-primary"}
        onClick={() => onChange("schedules")}
      >
        Horários
      </Button>

      <Button
        variant={activeTab === "appointments" ? "primary" : "outline-primary"}
        onClick={() => onChange("appointments")}
      >
        Agendamentos
      </Button>
    </div>
  );
}

EmployerMeTabs.propTypes = {
  activeTab: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
};
