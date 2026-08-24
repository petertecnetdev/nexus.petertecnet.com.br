// src/components/establishment/EstablishmentSegmentCard.jsx
import React from "react";
import PropTypes from "prop-types";
import "./EstablishmentSegmentCard.css";

export default function EstablishmentSegmentCard({
  label,
  description,
  value,
  selected,
  onToggle,
}) {
  const initials = label
    .split(" ")
    .map((w) => w[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  return (
    <div
      className={`segment-card ${selected ? "selected" : ""}`}
      onClick={() => onToggle(value, !selected)}
      role="button"
    >
      <div className="segment-card-header">
        <div className="segment-icon">{initials}</div>
        <div className="segment-label">{label}</div>
      </div>

      {description && (
        <div className="segment-description">{description}</div>
      )}
    </div>
  );
}

EstablishmentSegmentCard.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  value: PropTypes.string.isRequired,
  selected: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};
