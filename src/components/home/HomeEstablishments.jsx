// src/components/home/HomeEstablishments.jsx
import React from "react";
import "./HomeEstablishments.css";

export default function HomeEstablishments({ establishments }) {
  return (
    <div className="homeest-container">
      <h2 className="section-title">Estabelecimentos</h2>
      {establishments.map((e) => (
        <div key={e.id} className="homeest-card">
          <div className="homeest-logo">
            <img src={e.images.logo} alt="" />
          </div>
          <h3>{e.name}</h3>
          <p>{e.city} - {e.uf}</p>
          <div className="homeest-stats">{e.total_views} visualizações</div>
        </div>
      ))}
    </div>
  );
}
