// src/components/home/HomeQuickStats.jsx
import React from "react";
import "./HomeQuickStats.css";

export default function HomeQuickStats({ stats }) {
  const data = [
    { label: "Usuários", value: stats.total_users },
    { label: "Estabelecimentos", value: stats.total_establishments },
    { label: "Profissionais", value: stats.total_employers },
    { label: "Serviços", value: stats.total_items },
  ];

  return (
    <div className="quickstats-container">
      {data.map((item, i) => (
        <div key={i} className="quickstats-card">
          <div className="quickstats-value">{item.value}</div>
          <div className="quickstats-label">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
