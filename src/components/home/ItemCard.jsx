import React from "react";
import "./ItemCard.css";

export default function ItemCard({ data }) {
  const img =
    data?.images?.avatar ||
    data?.images?.logo ||
    data?.images?.background ||
    "/images/placeholder.png";

  return (
    <div className="icard">
      <div className="icard-top">
        <img src={img} alt="" className="icard-img" />

        <div className="icard-info">
          <div className="icard-name">{data.name}</div>
          <div className="icard-price">R$ {Number(data.price).toFixed(2)}</div>
        </div>
      </div>

      <div className="icard-stats">
        {data.total_views} visualizações
      </div>
    </div>
  );
}
