// src/components/global/GlobalImage.jsx
import React from "react";
import PropTypes from "prop-types";
import EntityImage from "./EntityImage";

export default function GlobalImage({ path, alt, className, style, fallbackText, shape }) {
  return (
    <EntityImage
      src={path}
      name={fallbackText || alt || "Imagem"}
      alt={alt}
      className={className}
      style={style}
      shape={shape}
      loading="lazy"
    />
  );
}

GlobalImage.propTypes = {
  path: PropTypes.string,
  alt: PropTypes.string,
  className: PropTypes.string,
  style: PropTypes.object,
  fallbackText: PropTypes.string,
  shape: PropTypes.oneOf(["square", "round", "establishment"]),
};

GlobalImage.defaultProps = {
  path: null,
  alt: "",
  className: undefined,
  style: undefined,
  fallbackText: "",
  shape: "square",
};
