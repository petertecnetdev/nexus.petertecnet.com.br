// src/components/GlobalLoadingIndicator.js
import React from "react";
import loadingImage from "../images/logo.gif";

export default function GlobalLoadingIndicator() {
  return (
    <div
      style={{
        background: `url('/images/background-2.png') no-repeat center center`,
        backgroundSize: "cover",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
        padding: "0 20px",
        boxSizing: "border-box",
      }}
    >
      <img
        src={loadingImage}
        alt="Loading Rasoio"
        style={{
          borderRadius: "50%",
          width: "50%",
          maxWidth: "200px",
          height: "auto",
        }}
      />
    </div>
  );
}
