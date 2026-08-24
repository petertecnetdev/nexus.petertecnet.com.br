import React from "react";
import "./HomeSkeletonCard.css";

export default function HomeSkeletonCard() {
  return (
    <div className="hp-card hp-card--skeleton">
      <div className="hp-hero-overlay" />
      <div className="hp-logo-bubble hp-logo-bubble--skeleton" />
      <div className="hp-info">
        <div className="hp-name hp-skel-line" />
        <div className="hp-address hp-skel-line" />
        <div className="hp-badges">
          <span className="hp-skel-chip" />
          <span className="hp-skel-chip" />
          <span className="hp-skel-chip" />
        </div>
      </div>
    </div>
  );
}
