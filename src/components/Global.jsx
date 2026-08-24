// src/components/Global.jsx
import React from "react";
import { Spinner } from "react-bootstrap";
import "./Global.css"; // Estilos globais, se houver

export default function Global() {
  return (
    <div className="global-container">
      <div className="spinner-container">
        <Spinner animation="border" variant="primary" />
        <span>Carregando...</span>
      </div>
    </div>
  );
}
