import React from "react";
import "./StatCard.css";

export default function StatCard({ value, label }) {
  return (
    <div className="scard">
      <div className="scard-inner">
        <div className="scard-value">{value}</div>
        <div className="scard-label">{label}</div>
      </div>
    </div>
  );
}
