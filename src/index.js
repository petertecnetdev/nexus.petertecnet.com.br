import { startTelemetry } from "./telemetry";
import { apiBaseUrl, appSlug } from "./config";
import React from "react";
import ReactDOM from "react-dom/client";
import axios from "axios";
import App from "./App";
import PeterTecnetSignature from "./components/PeterTecnetSignature";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

startTelemetry({ apiBaseUrl, appSlug });

axios.defaults.headers.common["X-Peter-App"] = "nexus";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
    <PeterTecnetSignature />
  </React.StrictMode>
);
