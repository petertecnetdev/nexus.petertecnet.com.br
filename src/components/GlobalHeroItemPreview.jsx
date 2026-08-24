import React from "react";
import "./GlobalHeroItemPreview.css";

export default function GlobalHeroItemPreview({ image, name }) {
  const getInitials = () => {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
      ? parts[0][0].toUpperCase()
      : parts[0][0].toUpperCase() + parts.at(-1)[0].toUpperCase();
  };

  const initials = getInitials();

  return (
    <div className="ghi-preview-root">
      <div className="ghi-preview-circle">
        {image ? (
          <img src={image} alt={name} className="ghi-preview-img" />
        ) : (
          <div className="ghi-preview-initials">{initials}</div>
        )}
      </div>

      <div className="ghi-preview-title">{name || "Item"}</div>
    </div>
  );
}
