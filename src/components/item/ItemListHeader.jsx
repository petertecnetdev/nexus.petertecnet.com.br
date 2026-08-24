import React from "react";
import "./ItemListHero.css";

export default function ItemListHero({ establishment }) {
  return (
    <div className="iteml-hero-box">
      <h2 className="iteml-hero-title">
        Itens de {establishment?.name || ""}
      </h2>

      {establishment?.description && (
        <p className="iteml-hero-desc">{establishment.description}</p>
      )}
    </div>
  );
}
