import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import useImageUtils from "../hooks/useImageUtils";
import "./GlobalHeroUpdate.css";

export default function GlobalHeroUpdate({ name, images }) {
  const { imageUrl, handleImgError: baseHandleImgError } = useImageUtils();
  const [broken, setBroken] = useState(false);

  // 🔹 Resolve a imagem igual ao GlobalCard
  const image = useMemo(() => {
    const paths = [
      images?.avatar,
      images?.logo,
      images?.background,
      Array.isArray(images?.gallery) ? images.gallery[0] : null,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }
    return null;
  }, [images, imageUrl]);

  // 🔹 Gera iniciais baseado no NOME da entidade
  const initials = useMemo(() => {
    if (!name) return "?";
    const parts = name.trim().split(" ");

    if (parts.length === 1) {
      return parts[0][0].toUpperCase();
    }

    return (
      parts[0][0].toUpperCase() +
      parts[parts.length - 1][0].toUpperCase()
    );
  }, [name]);

  const handleImgError = (e) => {
    baseHandleImgError(e);
    setBroken(true);
  };

  return (
    <div className="ghu-wrapper">
      <div className="ghu-image-container">
        {image && !broken ? (
          <img
            src={image}
            alt={name}
            className="ghu-image"
            onError={handleImgError}
          />
        ) : (
          <div className="ghu-placeholder">
            {initials}
          </div>
        )}
      </div>

      <div className="ghu-label">
        {name || "Carregando..."}
      </div>
    </div>
  );
}

GlobalHeroUpdate.propTypes = {
  name: PropTypes.string,
  images: PropTypes.object,
};

GlobalHeroUpdate.defaultProps = {
  name: "",
  images: {},
};
