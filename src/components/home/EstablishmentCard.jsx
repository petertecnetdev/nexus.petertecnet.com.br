// src/components/home/EstablishmentCard.jsx
import React from "react";
import PropTypes from "prop-types";
import EntityImage from "../EntityImage";
import "./EstablishmentCard.css";

export default function EstablishmentCard({ data }) {
  const name = data?.fantasy || data?.name || "Empresa";
  const files = Array.isArray(data?.files) ? data.files : [];
  const images = [
    data?.images?.logo,
    data?.logo,
    data?.images?.avatar,
    files.find((file) => file?.type === "logo")?.public_url,
    data?.images?.background,
    files.find((file) => file?.is_primary)?.public_url,
    files[0]?.public_url,
  ];

  return (
    <div className="estcard">
      <div className="estcard-top">
        <EntityImage src={images} name={name} alt={name} shape="establishment" className="estcard-logo" loading="lazy" />
        <div className="estcard-info">
          <div className="estcard-name">{name}</div>
          <div className="estcard-sub">{data?.city}{data?.city && data?.uf ? " - " : ""}{data?.uf}</div>
        </div>
      </div>
      <div className="estcard-stats">{Number(data?.total_views || 0).toLocaleString("pt-BR")} visualizações</div>
    </div>
  );
}

EstablishmentCard.propTypes = { data: PropTypes.object.isRequired };
