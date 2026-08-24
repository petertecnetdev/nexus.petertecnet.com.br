// src/components/home/HomeItems.jsx
import React from "react";
import "./HomeItems.css";

export default function HomeItems({ items }) {
  return (
    <div className="homeitems-container">
      <h2 className="section-title">Serviços</h2>

      {items.map((item) => (
        <div key={item.id} className="homeitems-card">
          <img src={item.images.avatar} className="homeitems-img" alt="" />
          <h3>{item.name}</h3>
          <div className="homeitems-price">R$ {item.price}</div>
          <div className="homeitems-views">
            {item.total_views} visualizações
          </div>
        </div>
      ))}
    </div>
  );
}
