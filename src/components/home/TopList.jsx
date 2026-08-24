import React from "react";
import "./TopList.css";

export default function TopList({ title, items }) {
  return (
    <div className="tl-wrapper">
      <div className="tl-header">
        <h3 className="tl-title">{title}</h3>
      </div>

      <div className="tl-list">
        {items?.map((item, index) => (
          <div key={index} className="tl-row">
            <div className="tl-info">
              <div className="tl-label">{item.label}</div>
              <div className="tl-value">{item.value}</div>
            </div>

            <div className="tl-bar">
              <div
                className="tl-bar-fill"
                style={{ width: item.percent ? `${item.percent}%` : "0%" }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
