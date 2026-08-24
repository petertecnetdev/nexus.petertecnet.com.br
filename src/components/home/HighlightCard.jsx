import React from "react";
import "./HighlightCard.css";

export default function HighlightCard({ avatar, icon, title, subtitle }) {
  return (
    <div className="hcard">
      <div className="hcard-media">
        {avatar && <img src={avatar} alt="" className="hcard-avatar" />}

        {!avatar && icon && (
          <div className="hcard-icon">
            {icon}
          </div>
        )}
      </div>

      <div className="hcard-info">
        <div className="hcard-title">{title}</div>
        <div className="hcard-sub">{subtitle}</div>
      </div>
    </div>
  );
}
