import React from "react";
import "./ItemListHeader.css";

export default function ItemListHeader({ servicesCount, productsCount }) {
  return (
    <div className="iteml-header">
      <div className="iteml-header-section">
        <span className="iteml-header-label">Serviços</span>
        <span className="iteml-header-count">{servicesCount}</span>
      </div>

      <div className="iteml-header-section">
        <span className="iteml-header-label">Produtos</span>
        <span className="iteml-header-count">{productsCount}</span>
      </div>
    </div>
  );
}
