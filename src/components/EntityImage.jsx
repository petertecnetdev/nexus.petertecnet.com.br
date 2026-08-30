import React, { useMemo } from "react";
import PropTypes from "prop-types";
import useImageUtils from "../hooks/useImageUtils";

/**
 * Imagem padrão para empresas, produtos e serviços da Nexus.
 *
 * Regra visual única:
 * - existe imagem válida -> mostra a imagem;
 * - sem imagem ou imagem quebrada -> mostra as iniciais do nome.
 *
 * O fallback é um SVG em data URI para preservar exatamente o mesmo <img>
 * e, portanto, todas as dimensões/object-fit já definidas pelos CSS existentes.
 */
export default function EntityImage({ src, name, alt, shape, ...imgProps }) {
  const { imageUrl, placeholderSvg } = useImageUtils({
    fallbackText: name || "?",
    fallbackShape: shape,
  });

  const resolvedSrc = useMemo(() => {
    const candidates = Array.isArray(src) ? src : [src];
    for (const candidate of candidates) {
      const url = imageUrl(candidate);
      if (url) return url;
    }
    return placeholderSvg;
  }, [src, imageUrl, placeholderSvg]);

  const handleError = (event) => {
    event.currentTarget.onerror = null;
    event.currentTarget.src = placeholderSvg;
  };

  return (
    <img
      {...imgProps}
      src={resolvedSrc || placeholderSvg}
      alt={alt ?? name ?? ""}
      onError={handleError}
    />
  );
}

EntityImage.propTypes = {
  src: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.oneOf([null])])),
  ]),
  name: PropTypes.string,
  alt: PropTypes.string,
  shape: PropTypes.oneOf(["square", "round", "establishment"]),
};

EntityImage.defaultProps = {
  src: null,
  name: "",
  alt: undefined,
  shape: "square",
};
