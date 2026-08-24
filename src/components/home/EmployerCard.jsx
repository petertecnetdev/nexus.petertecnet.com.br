// src/components/home/EmployerCard.jsx
import React from "react";
import "./EmployerCard.css";

export default function EmployerCard({ data, openSchedulePopup }) {
  const img =
    data?.avatar ||
    data?.images?.avatar ||
    "/images/placeholder.png";

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
        <img src={img} alt={data.name} className="ecard-avatar" />

        <div className="ecard-info">
          <div className="ecard-name">{data.name}</div>
          <div className="ecard-sub">{data.establishment?.name}</div>
        </div>
      </div>

      <div className="ecard-stats">
        {data.completed_appointments} atendimentos concluídos
      </div>
    </div>
  );
}
