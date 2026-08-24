// src/components/global/GlobalDatePicker.jsx
import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";

export default function GlobalDatePicker({
  days,
  selectedKey,
  disabled,
  onSelect,
}) {
  return (
    <>
      {days.map((d) => (
        <Button
          key={d.key}
          size="sm"
          variant={selectedKey === d.key ? "warning" : "secondary"}
          disabled={disabled}
          onClick={() => onSelect(d.key)}
        >
          {d.label}
        </Button>
      ))}
    </>
  );
}

GlobalDatePicker.propTypes = {
  days: PropTypes.array.isRequired,
  selectedKey: PropTypes.string,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};
