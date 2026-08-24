// src/components/global/GlobalImage.jsx
import React from "react";
import PropTypes from "prop-types";
import { storageUrl } from "../../config";

const PLACEHOLDER = "/images/logo.png";

export default function GlobalImage({ path, alt, className, style }) {
  const src = path ? `${storageUrl}/${path}` : PLACEHOLDER;

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = PLACEHOLDER;
      }}
    />
  );
}

GlobalImage.propTypes = {
  path: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
};
