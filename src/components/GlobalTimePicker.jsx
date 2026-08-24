// src/components/global/GlobalTimePicker.jsx
import React from "react";
import PropTypes from "prop-types";
import { Button } from "react-bootstrap";

export default function GlobalTimePicker({ times, disabled, onSelect }) {
  if (!times.length)
    return <div className="text-muted">Nenhum horário disponível.</div>;

  return (
    <>
      {times.map((t) => (
        <Button
          key={t}
          size="sm"
          className="bg-black"
          disabled={disabled}
          onClick={() => onSelect(t)}
        >
          {t}
        </Button>
      ))}
    </>
  );
}

GlobalTimePicker.propTypes = {
  times: PropTypes.array.isRequired,
  disabled: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
};
