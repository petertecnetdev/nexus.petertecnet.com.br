// src/components/home/HomeGlobalActivity.jsx
import React from "react";
import "./HomeGlobalActivity.css";

export default function HomeGlobalActivity({ stats }) {
  return (
    <div className="globalact-container">
      <h2 className="section-title">Atividade global</h2>

      <div className="globalact-circle">
        <div className="circle-value">{stats.dau}</div>
        <div className="circle-text">DAU</div>
      </div>

      <div className="globalact-mau">MAU: {stats.mau}</div>
      <div className="globalact-ratio">
        DAU/MAU Ratio: {stats.dau_mau_ratio}
      </div>
    </div>
  );
}
