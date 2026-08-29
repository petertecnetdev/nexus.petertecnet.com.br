import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <PeterTecnetSignature />
  </React.StrictMode>
);
