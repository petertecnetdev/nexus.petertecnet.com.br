import React from "react";

export default function HomeSection({ title, children }) {
  return (
    <div className="mb-5">
      <h3 className="text-light mb-3 fw-bold">{title}</h3>
      {children}
    </div>
  );
}
