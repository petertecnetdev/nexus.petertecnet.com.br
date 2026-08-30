import React from "react";
import PropTypes from "prop-types";
import EntityImage from "../EntityImage";
import "./ItemCard.css";

export default function ItemCard({ data }) {
  const name = data?.name || "Item";
  const files = Array.isArray(data?.files) ? data.files : [];
  const images = [
    data?.images?.avatar,
    data?.images?.cover,
    data?.image_url,
    data?.image,
    files.find((file) => file?.is_primary)?.public_url,
    files.find((file) => file?.type === "image")?.public_url,
    data?.images?.background,
    files[0]?.public_url,
  ];

  return (
    <div className="icard">
      <div className="icard-top">
        <EntityImage src={images} name={name} alt={name} className="icard-img" loading="lazy" />
        <div className="icard-info">
          <div className="icard-name">{name}</div>
          <div className="icard-price">R$ {Number(data?.price || 0).toFixed(2)}</div>
        </div>
      </div>
      <div className="icard-stats">{Number(data?.total_views || 0).toLocaleString("pt-BR")} visualizações</div>
    </div>
  );
}

ItemCard.propTypes = { data: PropTypes.object.isRequired };
