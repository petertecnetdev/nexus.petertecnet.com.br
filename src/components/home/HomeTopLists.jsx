// src/components/home/HomeTopLists.jsx
import React from "react";
import "./HomeTopLists.css";

export default function HomeTopLists({ stats }) {
  return (
    <div className="toplists-container">
      <div className="toplist-section">
        <h2 className="section-title">Mais vistos – Estabelecimentos</h2>
        {stats.top_viewed_establishments?.map((e) => (
          <div key={e.id} className="toplist-row">
            {e.name} — {e.total_views}
          </div>
        ))}
      </div>

      <div className="toplist-section">
        <h2 className="section-title">Mais vendidos (mês)</h2>
        {stats.most_popular_items?.map((i) => (
          <div key={i.id} className="toplist-row">
            {i.name} — {i.completed}
          </div>
        ))}
      </div>
    </div>
  );
}
