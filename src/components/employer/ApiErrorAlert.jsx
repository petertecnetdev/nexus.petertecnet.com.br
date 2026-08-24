// src/components/employer/ApiErrorAlert.jsx
import React from "react";
import { Alert } from "react-bootstrap";
import PropTypes from "prop-types";

export default function ApiErrorAlert({ error }) {
  if (!error) return null;

  return (
    <Alert variant="danger" className="mb-4">
      {error}
    </Alert>
  );
}

ApiErrorAlert.propTypes = {
  error: PropTypes.string,
};
