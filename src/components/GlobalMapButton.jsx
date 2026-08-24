// src/components/GlobalMapButton.jsx
import React from "react";
import PropTypes from "prop-types";
import { FaMapMarkerAlt } from "react-icons/fa";
import GlobalButton from "./GlobalButton";
import "./GlobalMapButton.css";

export default function GlobalMapButton({ location, address, city, uf }) {
  const resolveUrl = () => {
    if (location && location.includes("google.com/maps")) return location;

    if (address && city && uf)
      return `https://www.google.com/maps?q=${encodeURIComponent(
        `${address}, ${city} - ${uf}`
      )}`;

    if (city && uf)
      return `https://www.google.com/maps?q=${encodeURIComponent(
        `${city} - ${uf}`
      )}`;

    return null;
  };

  const url = resolveUrl();
  if (!url) return null;

  return (
    <GlobalButton
      variant="primary"
      rounded
      full
      size="md"
      className="gmapbtn"
      onClick={() => window.open(url, "_blank")}
    >
      <FaMapMarkerAlt className="gmapbtn-icon" />
     Localização
    </GlobalButton>
  );
}

GlobalMapButton.propTypes = {
  location: PropTypes.string,
  address: PropTypes.string,
  city: PropTypes.string,
  uf: PropTypes.string,
};
