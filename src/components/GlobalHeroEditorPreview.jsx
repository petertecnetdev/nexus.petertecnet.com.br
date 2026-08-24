// src/components/GlobalHeroEditorPreview.jsx
import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import useImageUtils from "../hooks/useImageUtils";
import "./GlobalHeroEditorPreview.css";

export default function GlobalHeroEditorPreview({
  entity = "generic",
  title,
  subtitle,
  logoPreview,
  backgroundPreview,
  data = {},
}) {
  const { imageUrl } = useImageUtils();
  const [imgBroken, setImgBroken] = useState(false);

  useEffect(() => {
    setImgBroken(false);
  }, [logoPreview]);

  const getInitials = () => {
    const base = data?.name || data?.first_name || title || "?";
    const parts = base.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : (parts[0][0] + parts.at(-1)[0]).toUpperCase();
  };

  const mainImage = useMemo(() => {
    if (logoPreview && !imgBroken) return logoPreview;

    const paths = [
      data?.image,
      data?.avatar,
      data?.logo,
      data?.images?.avatar,
      data?.images?.logo,
      Array.isArray(data?.images?.gallery) ? data.images.gallery[0] : null,
    ];

    for (const p of paths) {
      const url = imageUrl(p);
      if (url) return url;
    }

    return null;
  }, [logoPreview, data, imageUrl, imgBroken]);

  const bgImage = useMemo(() => {
    if (entity === "item") return null;

    if (backgroundPreview) return backgroundPreview;

    const bg =
      data?.background ||
      data?.images?.background ||
      (Array.isArray(data?.images?.gallery) ? data.images.gallery[0] : null);

    return imageUrl(bg);
  }, [entity, backgroundPreview, data, imageUrl]);

  const showImg = mainImage && !imgBroken;

  return (
    <div
      className="ghep-root"
      style={{
        backgroundImage: bgImage
          ? `linear-gradient(rgba(7,7,12,0.75),rgba(3,3,8,0.95)), url('${bgImage}')`
          : "linear-gradient(rgba(7,7,12,0.75),rgba(3,3,8,0.95))",
      }}
    >
      <div className="ghep-center">
        <div className="ghep-image-box">
          {showImg ? (
            <img
              src={mainImage}
              className="ghep-image"
              onError={() => setImgBroken(true)}
              alt="preview"
            />
          ) : (
            <div className="ghep-placeholder">{getInitials()}</div>
          )}
        </div>

        {title && <h3 className="ghep-title">{title}</h3>}
        {subtitle && <p className="ghep-sub">{subtitle}</p>}
      </div>
    </div>
  );
}

GlobalHeroEditorPreview.propTypes = {
  entity: PropTypes.string,
  title: PropTypes.string,
  subtitle: PropTypes.string,
  data: PropTypes.object,
  logoPreview: PropTypes.string,
  backgroundPreview: PropTypes.string,
};
