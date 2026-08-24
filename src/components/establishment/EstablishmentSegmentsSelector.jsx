// src/components/establishment/EstablishmentSegmentsSelector.jsx
import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import EstablishmentSegmentCard from "./EstablishmentSegmentCard";
import "./EstablishmentSegmentsSelector.css";

export default function EstablishmentSegmentsSelector({
  segments,
  segmentOptions,
  onChange,
}) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return segmentOptions;
    return segmentOptions.filter((s) =>
      s.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [search, segmentOptions]);

  const handleToggle = (value, checked) => {
    onChange({
      target: { value, checked },
    });
  };

  return (
    <>
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Buscar segmento..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="segments-grid-4">
        {filtered.map((seg) => (
          <EstablishmentSegmentCard
            key={seg.value}
            value={seg.value}
            label={seg.label}
            description={seg.description}
            selected={segments.includes(seg.value)}
            onToggle={handleToggle}
          />
        ))}
      </div>
    </>
  );
}

EstablishmentSegmentsSelector.propTypes = {
  segments: PropTypes.array.isRequired,
  segmentOptions: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
};
