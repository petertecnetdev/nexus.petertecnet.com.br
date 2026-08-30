// src/components/home/EmployerCard.jsx
import React from "react";
import PropTypes from "prop-types";
import EntityImage from "../EntityImage";
import "./EmployerCard.css";

export default function EmployerCard({ data, openSchedulePopup }) {
  const name = data?.name || "Colaborador";
  const images = [data?.avatar, data?.images?.avatar, data?.user?.avatar];

  const handleScheduleClick = () => {
    if (typeof openSchedulePopup !== "function") return;
    openSchedulePopup({
      type: "employer",
      id: data.id,
      establishment_slug: data.establishment?.slug || data.establishment_slug,
    });
  };

  return (
    <div className="ecard" onClick={handleScheduleClick} style={{ cursor: "pointer" }}>
      <div className="ecard-top">
        <EntityImage src={images} name={name} alt={name} shape="round" className="ecard-avatar" loading="lazy" />
        <div className="ecard-info">
          <div className="ecard-name">{name}</div>
          <div className="ecard-sub">{data.establishment?.name}</div>
        </div>
      </div>
      <div className="ecard-stats">{data.completed_appointments} atendimentos concluídos</div>
    </div>
  );
}

EmployerCard.propTypes = {
  data: PropTypes.object.isRequired,
  openSchedulePopup: PropTypes.func,
};
