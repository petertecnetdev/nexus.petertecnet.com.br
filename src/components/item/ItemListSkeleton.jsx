import React from "react";
import "./ItemListSkeleton.css";

export default function ItemListSkeleton() {
  return (
    <div className="iteml-skeleton-root">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="iteml-skeleton-card" />
      ))}
    </div>
  );
}
