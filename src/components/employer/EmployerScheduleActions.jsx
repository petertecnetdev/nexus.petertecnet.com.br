// src/components/employer/EmployerScheduleActions.jsx
import React from "react";
import { Button } from "react-bootstrap";
import PropTypes from "prop-types";

export default function EmployerScheduleActions({ saving, onSave }) {
  return (
    <div className="text-end mt-4">
      <Button onClick={onSave} disabled={saving}>
        {saving ? "Salvando..." : "Salvar horários"}
      </Button>
    </div>
  );
}

EmployerScheduleActions.propTypes = {
  saving: PropTypes.bool.isRequired,
  onSave: PropTypes.func.isRequired,
};
