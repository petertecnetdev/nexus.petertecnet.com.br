// src/components/home/HomeCityHighlights.jsx
import React from "react";
import "./HomeCityHighlights.css";

export default function HomeCityHighlights({ stats, city, uf }) {
  if (!city || !uf) return null;

  return (
    <div className="highlight-container">
      <h2 className="section-title">Destaques de {city} / {uf}</h2>

      <div className="highlight-grid">
        {stats.barber_of_the_city && (
          <div className="highlight-card">
            <img
              src={stats.barber_of_the_city.user?.avatar}
              className="highlight-avatar"
              alt=""
            />
            <h3>{stats.barber_of_the_city.user?.first_name}</h3>
            <p>Barbeiro do mês</p>
          </div>
        )}

        {stats.top_item_week && (
          <div className="highlight-card">
            <div className="circle-icon"></div>
            <h3>{stats.top_item_week.name}</h3>
            <p>Mais visto da semana</p>
          </div>
        )}

        {stats.most_sold_item_month && (
          <div className="highlight-card">
            <div className="circle-icon"></div>
            <h3>{stats.most_sold_item_month.item?.name}</h3>
            <p>Mais vendido do mês</p>
          </div>
        )}
      </div>
    </div>
  );
}
