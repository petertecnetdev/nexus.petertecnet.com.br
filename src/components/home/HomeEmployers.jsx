// src/components/home/HomeEmployers.jsx
import React from "react";
import "./HomeEmployers.css";

export default function HomeEmployers({ employers }) {
  return (
    <div className="homeemp-container">
      <h2 className="section-title">Profissionais</h2>

      {employers.map((emp) => (
        <div key={emp.id} className="homeemp-card">
          <img src={emp.avatar} className="homeemp-avatar" alt="" />
          <div className="homeemp-name">{emp.name}</div>
          <div className="homeemp-sub">{emp.establishment.name}</div>
          <div className="homeemp-metric">
            {emp.completed_appointments} atendimentos concluídos
          </div>
        </div>
      ))}
    </div>
  );
}
